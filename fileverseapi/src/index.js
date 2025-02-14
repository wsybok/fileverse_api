require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Agent } = require('@fileverse/agents');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(helmet());
app.use(express.json());

// 初始化 Fileverse Agent
const agent = new Agent({
    chain: process.env.CHAIN,
    privateKey: process.env.PRIVATE_KEY,
    pinataJWT: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
    pimlicoAPIKey: process.env.PIMLICO_API_KEY,
});

// API 路由
app.post('/api/files', async (req, res) => {
    try {
        const { content } = req.body;
        const file = await agent.create(content);
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await agent.getFile(fileId);
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { content } = req.body;
        const file = await agent.update(fileId, content);
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const result = await agent.delete(fileId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 启动服务器
app.listen(port, async () => {
    try {
        await agent.setupStorage('fileverse-api');
        console.log(`Fileverse API service is running on port ${port}`);
    } catch (error) {
        console.error('Failed to setup storage:', error);
        process.exit(1);
    }
}); 