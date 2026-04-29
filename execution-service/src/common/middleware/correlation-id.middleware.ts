import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id = (req.headers['x-correlation-id'] as string) || 'N/A';
    req.headers['x-correlation-id'] = id;
    res.setHeader('x-correlation-id', id);
    next();
  }
}
