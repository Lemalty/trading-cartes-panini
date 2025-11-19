import {createLogger, format, Logger, transports} from 'winston';
import {TransformableInfo} from 'logform';

const { combine, timestamp, printf, errors } = format;

/**
 * Custom log format that structures the log messages.
 * @param {TransformableInfo} info - An object containing log details.
 * @returns {string} - The formatted log string.
 */
const logFormat = printf(({level, message, stack, label, timestamp}: TransformableInfo) => {
    const actualLabel = label || '';
    const actualTimestamp = timestamp || new Date().toISOString();
    return `${actualTimestamp} [${actualLabel}] ${level}: ${stack || message}`;
});

/**
 * General logger for the application. This logger is configured to log messages from the entire application.
 * It logs to the console and to two files: one for error logs and one for combined logs.
 */
export const appLogger: Logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
});

/**
 * Custom format for console output that only includes the message.
 */
const consoleFormat = printf(({message}: TransformableInfo) => String(message));

/**
 * Logger instance specifically for console output with minimal formatting.
 */
export const consoleLogger: Logger = createLogger({
    level: 'info',
    format: combine(
        errors({ stack: true }),
        consoleFormat
    ),
    transports: [
        new transports.Console()
    ]
});

/**
 * Function to create app child loggers dynamically. These child loggers inherit the configurations of the appLogger.
 * @param {string} labelName - The label name for the child logger.
 * @returns {Logger} - The child logger.
 */
export const createAppChildLogger = (labelName: string): Logger => {
    return appLogger.child({ label: labelName });
};