import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Agent } from '@fileverse/agents';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { FormData, File, Blob } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import fetch from 'node-fetch';
import logger from './logger.js';

// 添加 BigInt 序列化支持
BigInt.prototype.toJSON = function() {
    return this.toString();
};

// 设置全局 polyfills
global.FormData = FormData;
global.File = File;
global.Blob = Blob;
global.fetch = fetch;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保日志目录存在
const logDir = join(dirname(__dirname), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(helmet());
app.use(express.json());

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', { 
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    if (err.message.includes('Role missing')) {
        // 处理 Role missing 错误
        const credsDir = join(dirname(__dirname), 'creds');
        if (fs.existsSync(credsDir)) {
            fs.readdirSync(credsDir)
                .filter(file => file.endsWith('.json'))
                .forEach(file => {
                    const filePath = join(credsDir, file);
                    fs.unlinkSync(filePath);
                    logger.info(`Deleted credential file: ${file}`);
                });
        }
        return res.status(500).json({
            error: 'Role missing error occurred. Credentials have been reset. Please try again.',
            details: '请确保凭证配置正确，然后重试。'
        });
    }

    if (err.message.includes('Insufficient Pimlico balance')) {
        const requiredBalance = err.message.match(/Balance required: ([\d.]+) USD/)?.[1] || 'unknown';
        const availableBalance = err.message.match(/Balance available: ([\d.]+) USD/)?.[1] || '0';
        
        logger.warn('Pimlico balance insufficient:', {
            required: requiredBalance,
            available: availableBalance,
            deficit: requiredBalance !== 'unknown' ? (parseFloat(requiredBalance) - parseFloat(availableBalance)).toFixed(6) : 'unknown'
        });

        return res.status(500).json({
            error: 'Insufficient Pimlico balance',
            details: '请访问 Pimlico 仪表板充值: https://dashboard.pimlico.io/',
            balance: {
                required: `${requiredBalance} USD`,
                available: `${availableBalance} USD`,
                deficit: requiredBalance !== 'unknown' ? 
                    `${(parseFloat(requiredBalance) - parseFloat(availableBalance)).toFixed(6)} USD` : 
                    'unknown'
            },
            instructions: [
                '1. 访问 Pimlico Dashboard (https://dashboard.pimlico.io/)',
                '2. 登录您的账户',
                '3. 点击 "Add Funds" 或 "Deposit" 按钮',
                '4. 选择支付方式并完成充值',
                '5. 等待余额更新后重试操作'
            ]
        });
    }

    res.status(500).json({ error: err.message });
};

// 初始化 Fileverse Agent
const initializeAgent = async () => {
    try {
        logger.info('Initializing Fileverse Agent...');
        
        const config = {
            chain: process.env.CHAIN,
            pinataJWT: process.env.PINATA_JWT,
            pinataGateway: process.env.PINATA_GATEWAY,
            pimlicoAPIKey: process.env.PIMLICO_API_KEY,
        };

        // 如果提供了私钥，则添加到配置中
        if (process.env.PRIVATE_KEY) {
            config.privateKey = process.env.PRIVATE_KEY;
            logger.debug('Using provided private key');
        } else {
            logger.debug('No private key provided, will use generated key');
        }

        const agent = new Agent(config);
        logger.info('Agent instance created');

        await agent.setupStorage('fileverse-api');
        logger.info('Storage setup completed');
        
        // 获取并记录最新区块号
        const latestBlockNumber = await agent.getBlockNumber();
        logger.info(`Latest block number: ${latestBlockNumber}`);
        
        return agent;
    } catch (error) {
        logger.error('Agent initialization failed:', { 
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

let agent;
(async () => {
    try {
        agent = await initializeAgent();
    } catch (error) {
        logger.error('Failed to initialize agent:', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
})();

// API 路由

// 获取最新区块号
app.get('/api/block-number', async (req, res, next) => {
    try {
        const blockNumber = await agent.getBlockNumber();
        logger.debug('Block number retrieved:', { blockNumber: blockNumber.toString() });
        res.json({ blockNumber: blockNumber.toString() });
    } catch (error) {
        next(error);
    }
});

// 创建文件
app.post('/api/files', async (req, res, next) => {
    try {
        const { content } = req.body;
        logger.debug('Creating file with content:', { 
            contentLength: content.length,
            content: content.substring(0, 100) // 只记录前100个字符
        });

        // 记录 agent 状态
        logger.debug('Agent status:', {
            isInitialized: !!agent,
            chain: process.env.CHAIN
        });

        const file = await agent.create(content);
        logger.info('File created successfully:', { 
            fileId: file.fileId,
            response: file
        });
        res.json(file);
    } catch (error) {
        logger.error('File creation failed:', {
            error: error.message,
            stack: error.stack,
            content: req.body.content?.substring(0, 100)
        });

        // 如果是 Role Missing 错误，尝试重新初始化
        if (error.message.includes('Role Missing')) {
            logger.info('Attempting to reinitialize agent...');
            try {
                agent = await initializeAgent();
                logger.info('Agent reinitialized successfully');
                
                // 重试创建文件
                const file = await agent.create(req.body.content);
                logger.info('File created after reinitialization:', { 
                    fileId: file.fileId,
                    response: file
                });
                return res.json(file);
            } catch (reinitError) {
                logger.error('Reinitialization failed:', {
                    error: reinitError.message,
                    stack: reinitError.stack
                });
            }
        }
        next(error);
    }
});

// 获取文件
app.get('/api/files/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        logger.debug('Retrieving file:', { fileId });
        const file = await agent.getFile(fileId);
        logger.info('File retrieved:', { fileId });
        res.json(file);
    } catch (error) {
        next(error);
    }
});

// 更新文件
app.put('/api/files/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const { content } = req.body;
        logger.debug('Updating file:', { fileId, contentLength: content.length });
        const file = await agent.update(fileId, content);
        logger.info('File updated:', { fileId });
        res.json(file);
    } catch (error) {
        next(error);
    }
});

// 删除文件
app.delete('/api/files/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        logger.debug('Deleting file:', { fileId });
        const result = await agent.delete(fileId);
        logger.info('File deleted:', { fileId });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// 健康检查端点
app.get('/health', async (req, res) => {
    try {
        const blockNumber = await agent.getBlockNumber();
        const status = { 
            status: 'ok',
            agent: agent ? 'initialized' : 'not initialized',
            blockNumber: blockNumber.toString(),
            chain: process.env.CHAIN
        };
        logger.debug('Health check:', status);
        res.json(status);
    } catch (error) {
        logger.error('Health check failed:', {
            error: error.message,
            stack: error.stack
        });
        res.json({ 
            status: 'error',
            error: error.message
        });
    }
});

// 注册错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(port, () => {
    logger.info(`Fileverse API service is running on port ${port}`);
}); 