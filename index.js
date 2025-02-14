require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Agent } = require('@fileverse/agents');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(helmet());
app.use(express.json());

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.message.includes('Role missing')) {
        // 处理 Role missing 错误
        const credsDir = path.join(__dirname, '..', 'creds');
        if (fs.existsSync(credsDir)) {
            fs.readdirSync(credsDir)
                .filter(file => file.endsWith('.json'))
                .forEach(file => {
                    fs.unlinkSync(path.join(credsDir, file));
                });
        }
        return res.status(500).json({
            error: 'Role missing error occurred. Credentials have been reset. Please try again.',
            details: '请确保已正确设置 PRIVATE_KEY 环境变量，然后重试。'
        });
    }

    res.status(500).json({ error: err.message });
};

// 初始化 Fileverse Agent
const initializeAgent = async () => {
    try {
        const agent = new Agent({
            chain: process.env.CHAIN,
            privateKey: process.env.PRIVATE_KEY,
            pinataJWT: process.env.PINATA_JWT,
            pinataGateway: process.env.PINATA_GATEWAY,
            pimlicoAPIKey: process.env.PIMLICO_API_KEY,
        });

        await agent.setupStorage('fileverse-api');
        
        // 获取并记录最新区块号
        const latestBlockNumber = await agent.getBlockNumber();
        console.log(`Latest block number: ${latestBlockNumber}`);
        
        return agent;
    } catch (error) {
        console.error('Agent initialization failed:', error);
        throw error;
    }
};

let agent;
(async () => {
    try {
        agent = await initializeAgent();
    } catch (error) {
        console.error('Failed to initialize agent:', error);
        process.exit(1);
    }
})();

// API 路由

// 获取最新区块号
app.get('/api/block-number', async (req, res, next) => {
    try {
        const blockNumber = await agent.getBlockNumber();
        res.json({ blockNumber });
    } catch (error) {
        next(error);
    }
});

// 创建文件
app.post('/api/files', async (req, res, next) => {
    try {
        const { content } = req.body;
        const file = await agent.create(content);
        console.log('File created:', file);
        res.json(file);
    } catch (error) {
        next(error);
    }
});

// 获取文件
app.get('/api/files/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const file = await agent.getFile(fileId);
        console.log('File retrieved:', file);
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
        const file = await agent.update(fileId, content);
        console.log('File updated:', file);
        res.json(file);
    } catch (error) {
        next(error);
    }
});

// 删除文件
app.delete('/api/files/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const result = await agent.delete(fileId);
        console.log('File deleted:', result);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// 健康检查端点
app.get('/health', async (req, res) => {
    try {
        const blockNumber = await agent.getBlockNumber();
        res.json({ 
            status: 'ok',
            agent: agent ? 'initialized' : 'not initialized',
            blockNumber,
            chain: process.env.CHAIN
        });
    } catch (error) {
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
    console.log(`Fileverse API service is running on port ${port}`);
}); 