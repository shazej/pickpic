
// Simple Structured Logger
// In production, sync with file system or external collector.
// For Windows Server: Console logging (captured by NSSM/IIS) + File fallback (optional).

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'INFO';

function format(level: LogLevel, message: string, meta?: any) {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        environment: process.env.NODE_ENV,
        ...meta,
    });
}

export const logger = {
    debug: (message: string, meta?: any) => {
        if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.DEBUG) {
            console.debug(format('DEBUG', message, meta));
        }
    },
    info: (message: string, meta?: any) => {
        if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.INFO) {
            console.log(format('INFO', message, meta));
        }
    },
    warn: (message: string, meta?: any) => {
        if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.WARN) {
            console.warn(format('WARN', message, meta));
        }
    },
    error: (message: string, meta?: any) => {
        // Always log errors, regardless of level setting if it were dynamic, but here simple level check
        if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.ERROR) {
            console.error(format('ERROR', message, meta));
        }
    },
};

// Ensure stdout is non-blocking for high volume in prod (Node specific)
if (process.stdout._handle && process.stdout._handle.setBlocking) {
    process.stdout._handle.setBlocking(false);
}
