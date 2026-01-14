import { Injectable, Logger, Scope } from '@nestjs/common';
import { storage } from '../request-context';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger {
  log(message: any, context?: string) {
    const correlationId = storage.getStore()?.get('correlationId');
    const formattedMessage = correlationId ? `[${correlationId}] ${message}` : message;
    super.log(formattedMessage, context);
  }

  error(message: any, stack?: string, context?: string) {
    const correlationId = storage.getStore()?.get('correlationId');
    const formattedMessage = correlationId ? `[${correlationId}] ${message}` : message;
    super.error(formattedMessage, stack, context);
  }

  warn(message: any, context?: string) {
    const correlationId = storage.getStore()?.get('correlationId');
    const formattedMessage = correlationId ? `[${correlationId}] ${message}` : message;
    super.warn(formattedMessage, context);
  }
}
