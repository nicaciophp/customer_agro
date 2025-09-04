import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;

    const requestId = uuidv4();
    request['requestId'] = requestId;

    const startTime = Date.now();

    const logContext = {
      requestId,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
    };

    this.logger.log(`Incoming Request: ${method} ${url}`, logContext);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.logRequest(method, url, statusCode, duration, {
            ...logContext,
            responseSize: JSON.stringify(data || {}).length,
          });

          if (duration > 1000) {
            this.logger.logPerformanceMetric('slow_request', duration, 'ms', logContext);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          this.logger.error(
            `Request Error: ${method} ${url}`,
            error.stack,
            { ...logContext, statusCode, duration, error: error.message }
          );
        },
      }),
    );
  }
}