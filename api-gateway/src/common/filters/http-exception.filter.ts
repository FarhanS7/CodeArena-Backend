import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: "Internal server error" };

    const message =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as any).message || "Internal server error";

    const error =
      typeof exceptionResponse === "object"
        ? (exceptionResponse as any).error || "Error"
        : "Error";

    const correlationId = request.headers["x-correlation-id"] || "N/A";

    this.logger.error(
      `[${correlationId}] ${status} ${request.method} ${request.url} - ${message}`
    );

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      stack: process.env.NODE_ENV !== "production" ? exception.stack : undefined,
    });
  }
}
