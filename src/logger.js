import winston from 'winston';
import 'winston-daily-rotate-file';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 日志级别定义
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

// 创建日志目录
const logDir = join(dirname(__dirname), 'logs');

// 创建 Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // 错误日志
        new winston.transports.DailyRotateFile({
            filename: join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d',
            maxSize: '20m',
        }),
        // 所有日志
        new winston.transports.DailyRotateFile({
            filename: join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            maxSize: '20m',
        }),
        // 控制台输出
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
});

export default logger; 