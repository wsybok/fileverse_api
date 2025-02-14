# Fileverse API 服务

这是一个基于 Fileverse SDK 的 API 服务，提供文件管理功能。

## 功能特性

- 文件创建、读取、更新和删除
- 基于 Fileverse SDK 的去中心化存储
- 区块链交互功能（区块号查询等）
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
- Docker Compose (可选)

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

### 重要说明

1. **凭证管理**：
   - `/creds` 目录用于存储 Fileverse SDK 的凭证文件
   - 该目录已添加到 `.gitignore` 以确保安全性
   - 如遇到 "Role missing" 错误：
     1. 删除 `/creds` 目录中的 JSON 文件
     2. 确保已正确设置 `PRIVATE_KEY` 环境变量
     3. 重新运行服务

2. **文件加密**：
   - Fileverse SDK 目前不直接支持文件加密
   - 如需加密，请在应用层实现
   - 未来版本将支持更多存储网络和加密功能

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
使用 Docker：
```bash
docker build -t fileverse-api .
docker run -p 3000:3000 --env-file .env fileverse-api
```

使用 Docker Compose（推荐）：
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## API 端点

### GET /api/block-number
获取最新区块号
```javascript
// 示例响应
{
    "blockNumber": "12345678"
}
```

### POST /api/files
创建新文件
```javascript
// 请求示例
{
    "content": "Hello World"
}

// 响应示例
{
    "fileId": "xxx",
    "content": "Hello World"
}
```

### GET /api/files/:fileId
获取文件内容
```javascript
// 响应示例
{
    "fileId": "xxx",
    "content": "Hello World"
}
```

### PUT /api/files/:fileId
更新文件内容
```javascript
// 请求示例
{
    "content": "Hello World 2"
}

// 响应示例
{
    "fileId": "xxx",
    "content": "Hello World 2"
}
```

### DELETE /api/files/:fileId
删除文件
```javascript
// 响应示例
{
    "success": true
}
```

### GET /health
健康检查端点
```javascript
// 响应示例
{
    "status": "ok",
    "agent": "initialized",
    "blockNumber": "12345678",
    "chain": "gnosis"
}
```

## 环境变量

- `CHAIN`: 区块链网络 (gnosis 或 sepolia)
- `PRIVATE_KEY`: 私钥
- `PINATA_JWT`: Pinata JWT token
- `PINATA_GATEWAY`: Pinata 网关
- `PIMLICO_API_KEY`: Pimlico API 密钥
- `PORT`: API 服务端口 (默认: 3000)
- `NODE_ENV`: 运行环境 (development/production)

## 故障排除

### Role Missing 错误
如果遇到 "Role missing" 错误，请按以下步骤操作：
1. 删除 `/creds` 目录中的所有 JSON 文件
2. 确保 `.env` 文件中的 `PRIVATE_KEY` 已正确设置
3. 重启服务

### 文件加密
目前 SDK 不直接支持文件加密。如果您的应用需要加密功能，请在应用层实现。我们建议：
- 在发送到 API 之前在客户端加密数据
- 使用标准的加密库和算法
- 安全地管理加密密钥

## 安全注意事项

- 确保 .env 文件不被提交到版本控制系统
- 保护好私钥和 API 密钥
- 在生产环境中使用安全的密钥管理系统
- 定期备份 `/creds` 目录内容

## License

MIT 