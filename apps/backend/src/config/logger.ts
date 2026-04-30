import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for readability
const myFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // Capture stack traces
        myFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(), // Colorize only console output
                myFormat
            )
        })
    ],
});

// If not in production, you might also log to a file
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
    logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}
