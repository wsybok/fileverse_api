# Fileverse API 服务

这是一个基于 Fileverse SDK 的 API 服务，提供文件管理功能。

## 功能特性

- 文件创建、读取、更新和删除
- 基于 Fileverse SDK 的去中心化存储
- Docker 容器化部署支持
- 安全的环境变量配置

## 技术栈

- Node.js
- Express.js
- Fileverse SDK
- Docker

## 开始使用

### 环境要求

- Node.js 18+
- Docker (可选)

### 安装

1. 克隆仓库：
```bash
git clone <your-repo-url>
cd fileverse-api
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：
```bash
cp .env.example .env
```
编辑 .env 文件，填入必要的配置信息。

### 运行

#### 本地开发
```bash
npm run dev
```

#### 生产环境
```bash
npm start
```

#### Docker 部署
```bash
docker build -t fileverse-api .
docker run -p 3000:3000 --env-file .env fileverse-api
```

## API 端点

### POST /api/files
创建新文件

### GET /api/files/:fileId
获取文件内容

### PUT /api/files/:fileId
更新文件内容

### DELETE /api/files/:fileId
删除文件

### GET /health
健康检查端点

## 环境变量

- `CHAIN`: 区块链网络 (gnosis 或 sepolia)
- `PRIVATE_KEY`: 私钥
- `PINATA_JWT`: Pinata JWT token
- `PINATA_GATEWAY`: Pinata 网关
- `PIMLICO_API_KEY`: Pimlico API 密钥
- `PORT`: API 服务端口 (默认: 3000)
- `NODE_ENV`: 运行环境 (development/production)

## 安全注意事项

- 确保 .env 文件不被提交到版本控制系统
- 保护好私钥和 API 密钥
- 在生产环境中使用安全的密钥管理系统

## License

MIT 