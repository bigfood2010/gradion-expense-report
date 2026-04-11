import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiErrorResponseDto } from '@gradion/shared/common';
import type { Response } from 'express';
import {
  REQUEST_ID_HEADER,
  createResponseMeta,
  type AppRequest,
} from '@backend/common/request-context';

type HttpExceptionResponse = string | object;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const context = host.switchToHttp();
    const request = context.getRequest<AppRequest>();
    const response = context.getResponse<Response>();
    const normalizedError = this.normalizeException(exception);
    const payload: ApiErrorResponseDto = {
      success: false,
      error: normalizedError,
      meta: createResponseMeta(request),
    };

    response.setHeader(REQUEST_ID_HEADER, payload.meta?.requestId ?? '');
    response.status(normalizedError.statusCode).json(payload);
  }

  private normalizeException(exception: unknown): ApiErrorResponseDto['error'] & {
    statusCode: number;
  } {
    if (exception instanceof BadRequestException) {
      const response = exception.getResponse();
      const message = this.pickMessage(response, exception.message);
      const details = this.pickDetails(response);

      return {
        statusCode: exception.getStatus(),
        code: 'VALIDATION_ERROR',
        message,
        ...(details === undefined ? {} : { details }),
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const statusCode = exception.getStatus();
      const message = this.pickMessage(response, exception.message);
      const details = this.pickDetails(response);

      return {
        statusCode,
        code: this.pickCode(response, statusCode),
        message,
        ...(details === undefined ? {} : { details }),
      };
    }

    const message =
      exception instanceof Error ? exception.message : 'An unexpected error occurred.';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message,
    };
  }

  private pickCode(response: HttpExceptionResponse, statusCode: number): string {
    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const error = payload.error;

      if (typeof error === 'string' && error.length > 0) {
        return error
          .replace(/[^A-Za-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .toUpperCase();
      }
    }

    return `HTTP_${statusCode}`;
  }

  private pickDetails(
    response: HttpExceptionResponse,
  ): Record<string, unknown> | readonly string[] | undefined {
    if (typeof response !== 'object' || response === null) {
      return undefined;
    }

    const payload = response as Record<string, unknown>;

    if (Array.isArray(payload.message)) {
      return payload.message as readonly string[];
    }

    const { message: _message, error: _error, statusCode: _statusCode, ...details } = payload;

    return Object.keys(details).length > 0 ? details : undefined;
  }

  private pickMessage(response: HttpExceptionResponse, fallback: string): string {
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const payload = response as Record<string, unknown>;
      const message = payload.message;

      if (Array.isArray(message)) {
        return message[0] ?? fallback;
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return fallback;
  }
}
