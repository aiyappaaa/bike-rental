import { isDevelopment, isProduction } from '@/config/env';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(meta && { meta }),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private output(logEntry: LogEntry): void {
    if (isDevelopment()) {
      // Pretty print for development
      const color = this.getColor(logEntry.level);
      console.log(
        `${color}[${logEntry.timestamp}] ${logEntry.level}:\x1b[0m ${logEntry.message}`,
        logEntry.meta ? logEntry.meta : ''
      );
    } else {
      // JSON format for production
      console.log(JSON.stringify(logEntry));
    }
  }

  private getColor(level: string): string {
    switch (level) {
      case 'ERROR':
        return '\x1b[31m'; // Red
      case 'WARN':
        return '\x1b[33m'; // Yellow
      case 'INFO':
        return '\x1b[36m'; // Cyan
      case 'DEBUG':
        return '\x1b[35m'; // Magenta
      default:
        return '\x1b[0m'; // Reset
    }
  }

  public error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const logEntry = this.formatMessage('error', message, meta);
      this.output(logEntry);
    }
  }

  public warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const logEntry = this.formatMessage('warn', message, meta);
      this.output(logEntry);
    }
  }

  public info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const logEntry = this.formatMessage('info', message, meta);
      this.output(logEntry);
    }
  }

  public debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const logEntry = this.formatMessage('debug', message, meta);
      this.output(logEntry);
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = new Logger();

// Express middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    const logMessage = `${method} ${url} ${statusCode} ${duration}ms`;
    const meta = {
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent: req.get('User-Agent'),
    };

    if (statusCode >= 400) {
      logger.warn(logMessage, meta);
    } else {
      logger.info(logMessage, meta);
    }
  });

  next();
};

// Error logging helper
export const logError = (error: Error, context?: string) => {
  logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
    stack: error.stack,
    name: error.name,
    context,
  });
};

// Performance logging helper
export const logPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  logger.debug(`Performance: ${operation} took ${duration}ms`);
};
