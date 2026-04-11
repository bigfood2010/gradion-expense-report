import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { ApiResponseDto } from '@gradion/shared/common';
import { map, type Observable } from 'rxjs';
import { createResponseMeta, type AppRequest } from '@backend/common/request-context';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponseDto<T> | T> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AppRequest>();

    return next.handle().pipe(
      map((data) => {
        if (this.shouldPassThrough(data)) {
          return data;
        }

        return {
          success: true,
          data,
          meta: createResponseMeta(request),
        };
      }),
    );
  }

  private shouldPassThrough(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const payload = data as Record<string, unknown>;

    if (typeof payload.success === 'boolean') {
      return true;
    }

    return typeof payload.status === 'string' && ('details' in payload || 'info' in payload);
  }
}
