import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { APP_ERROR_CATALOG } from './app-error-catalog';

type ExceptionResponse = string | object;

interface SerializedErrorResponse {
  error: {
    code: string;
    message: string;
    userMessage: string;
    statusCode: number;
    details?: unknown;
    path: string;
    timestamp: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const serialized = this.serializeError(status, exceptionResponse, request);

    response.status(status).json(serialized);
  }

  private serializeError(
    status: number,
    exceptionResponse: ExceptionResponse | null,
    request: Request,
  ): SerializedErrorResponse {
    const fallback =
      status === 401
        ? APP_ERROR_CATALOG.AUTH_UNAUTHORIZED
        : status === 400
          ? APP_ERROR_CATALOG.VALIDATION_FAILED
          : status === 404
            ? APP_ERROR_CATALOG.RESOURCE_NOT_FOUND
            : status === 403
              ? APP_ERROR_CATALOG.ACCESS_FORBIDDEN
              : APP_ERROR_CATALOG.INTERNAL_SERVER_ERROR;

    if (typeof exceptionResponse === 'string') {
      return this.buildResponse(status, request, {
        ...fallback,
        message: exceptionResponse,
      });
    }

    const responseBody = this.asErrorRecord(exceptionResponse);
    const code = this.readString(responseBody, 'code') ?? fallback.code;
    const message =
      this.readString(responseBody, 'message') ?? fallback.message;
    const userMessage =
      this.readString(responseBody, 'userMessage') ?? fallback.userMessage;
    const details = this.extractDetails(responseBody);

    return this.buildResponse(status, request, {
      code,
      message,
      userMessage,
      ...(details !== undefined ? { details } : {}),
    });
  }

  private buildResponse(
    status: number,
    request: Request,
    payload: {
      code: string;
      message: string;
      userMessage: string;
      details?: unknown;
    },
  ): SerializedErrorResponse {
    return {
      error: {
        code: payload.code,
        message: payload.message,
        userMessage: payload.userMessage,
        statusCode: status,
        ...(payload.details !== undefined ? { details: payload.details } : {}),
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private extractDetails(responseBody: Record<string, unknown>): unknown {
    if ('details' in responseBody) {
      return responseBody.details;
    }

    const message = responseBody.message;
    if (Array.isArray(message)) {
      const normalizedDetails: unknown[] = [];

      for (const value of message) {
        normalizedDetails.push(value);
      }

      return normalizedDetails;
    }

    return undefined;
  }

  private readString(source: Record<string, unknown>, key: string) {
    const value = source[key];
    return typeof value === 'string' ? value : undefined;
  }

  private asErrorRecord(
    value: ExceptionResponse | null,
  ): Record<string, unknown> {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  }
}
