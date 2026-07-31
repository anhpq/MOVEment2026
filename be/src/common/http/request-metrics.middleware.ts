import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'X-Request-Id';
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

@Injectable()
export class RequestMetricsMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = process.hrtime.bigint();
    const suppliedRequestId = request.header(REQUEST_ID_HEADER)?.trim();
    const requestId =
      suppliedRequestId && SAFE_REQUEST_ID.test(suppliedRequestId)
        ? suppliedRequestId
        : randomUUID();

    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const contentLength = response.getHeader('content-length');
      const responseBytes =
        typeof contentLength === 'number'
          ? contentLength
          : typeof contentLength === 'string'
            ? Number.parseInt(contentLength, 10) || 0
            : 0;

      this.logger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          route: request.originalUrl.split('?')[0],
          status: response.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          responseBytes,
        }),
      );
    });

    next();
  }
}
