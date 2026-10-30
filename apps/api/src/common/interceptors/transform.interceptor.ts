import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '@devpilot/shared';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const req = context.switchToHttp().getRequest<Request>();
    const correlationId = req.correlationId;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        correlationId,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}

