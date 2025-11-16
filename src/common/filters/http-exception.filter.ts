import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string | object = 'Something went wrong';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'object') {
        message = (errorResponse as any).message || exception.message;
        errors = (errorResponse as any).error || message;

        if (Array.isArray((errorResponse as any).message)) {
          errors = (errorResponse as any).message;
          message = 'Validation failed';
        }
      } else {
        message = errorResponse;
        errors = errorResponse;
      }

      response.status(status).json({
        success: false,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
        errors,
      });
    }
  }
}
