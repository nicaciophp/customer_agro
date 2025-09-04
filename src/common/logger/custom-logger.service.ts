import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.prettyPrint()
      ),
      defaultMeta: {
        service: process.env.APP_NAME || 'agriculture-api',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
            })
          )
        }),
        
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 5,
        }),
      ],
    });
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, { context });
  }

  logRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
    this.logger.info('HTTP Request', {
      type: 'http_request',
      method,
      url,
      statusCode,
      duration,
      ...context
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext) {
    this.logger.debug('Database Query', {
      type: 'database_query',
      query: query.substring(0, 1000),
      duration,
      ...context
    });
  }

  logBusinessEvent(event: string, data: any, context?: LogContext) {
    this.logger.info('Business Event', {
      type: 'business_event',
      event,
      data,
      ...context
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string, context?: LogContext) {
    this.logger.info('Performance Metric', {
      type: 'performance_metric',
      metric,
      value,
      unit,
      ...context
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    this.logger.warn('Security Event', {
      type: 'security_event',
      event,
      severity,
      ...context
    });
  }
}