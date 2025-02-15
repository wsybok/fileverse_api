# Fileverse API Service

A robust API service built on top of the [Fileverse SDK](https://www.npmjs.com/package/@fileverse/agents), providing decentralized file management capabilities.
For more information visit [Fileverse](https://fileverse.io/)
## Features

- File CRUD operations (Create, Read, Update, Delete)
- Decentralized storage using Fileverse SDK
- Blockchain interaction (block number queries, etc.)
- Docker containerization support
- Secure environment configuration
- Advanced logging system with rotation

## Tech Stack

- Node.js
- Express.js
- Fileverse SDK
- Docker
- Winston (for logging)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (optional)
- Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd fileverse-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration.

### Pimlico Configuration

Pimlico is used for ERC-4337 (Account Abstraction) transactions. You need to:

1. Register at [Pimlico Dashboard](https://dashboard.pimlico.io/)
2. Obtain your API key
3. Fund your account:
   - Log into Pimlico Dashboard
   - Click "Add Funds" or "Deposit"
   - Choose payment method (credit card or crypto)
   - Enter amount (recommended minimum: 0.01 USD)
   - Complete payment process
   - Wait for balance update (usually within minutes)
4. Add your API key to `.env`:
```env
PIMLICO_API_KEY=your_api_key_here
```

Note:
- Each transaction requires a balance (approximately 0.006 USD/transaction)
- Maintain a balance above 0.01 USD
- Balance alerts can be set up in the Dashboard
- Auto-funding is available (configurable in Dashboard)

### Important Notes

1. **Credential Management**:
   - `/creds` directory stores Fileverse SDK credentials
   - Directory is included in `.gitignore` for security
   - If you encounter "Role missing" error:
     1. Delete JSON files in `/creds` directory
     2. Ensure `PRIVATE_KEY` is correctly set in environment
     3. Restart the service

2. **File Encryption**:
   - File encryption not directly supported by Fileverse SDK
   - Implement encryption at application level if needed
   - Future versions will support more storage networks and encryption

### Running the Service

#### Development
```bash
npm run dev
```

#### Production
```bash
npm start
```

#### Docker Deployment
Using Docker:
```bash
docker build -t fileverse-api .
docker run -p 3000:3000 --env-file .env fileverse-api
```

Using Docker Compose (recommended):
```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

## API Endpoints

### GET /health
Health check endpoint
```javascript
// Response example
{
    "status": "ok",
    "agent": "initialized",
    "blockNumber": "12345678",
    "chain": "gnosis"
}
```

### GET /api/block-number
Get latest block number
```javascript
// Response example
{
    "blockNumber": "12345678"
}
```

### POST /api/files
Create new file
```javascript
// Request example
{
    "content": "Hello World"
}

// Response example
{
    "fileId": "xxx",
    "content": "Hello World"
}
```

### GET /api/files/:fileId
Get file content
```javascript
// Response example
{
    "fileId": "xxx",
    "content": "Hello World"
}
```

### PUT /api/files/:fileId
Update file content
```javascript
// Request example
{
    "content": "Hello World 2"
}

// Response example
{
    "fileId": "xxx",
    "content": "Hello World 2"
}
```

### DELETE /api/files/:fileId
Delete file
```javascript
// Response example
{
    "success": true
}
```

## Environment Variables

- `CHAIN`: Blockchain network (gnosis or sepolia)
- `PRIVATE_KEY`: Private key (optional)
- `PINATA_JWT`: Pinata JWT token
- `PINATA_GATEWAY`: Pinata gateway
- `PIMLICO_API_KEY`: Pimlico API key (required with sufficient balance)
- `PORT`: API service port (default: 3000)
- `NODE_ENV`: Runtime environment (development/production)
- `LOG_LEVEL`: Logging level (error/warn/info/debug)

## Troubleshooting

### Insufficient Pimlico Balance
If you encounter "Insufficient Pimlico balance" error:
1. Visit [Pimlico Dashboard](https://dashboard.pimlico.io/)
2. Log into your account
3. Add funds (recommended minimum 0.01 USD)
4. Retry operation

### Role Missing Error
If you encounter "Role missing" error:
1. Delete all JSON files in `/creds` directory
2. Verify `.env` configuration
3. Restart service

### File Encryption
Currently, SDK doesn't directly support file encryption. If your application requires encryption:
- Encrypt data on client-side before sending to API
- Use standard encryption libraries and algorithms
- Implement secure key management

## Security Considerations

- Keep `.env` file out of version control
- Protect private keys and API keys
- Use secure key management in production
- Backup `/creds` directory contents regularly
- Monitor Pimlico account balance

## License

MIT 
