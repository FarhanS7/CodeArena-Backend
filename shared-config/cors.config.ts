import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS Configuration for Code Arena
 * Standardized across all services for consistent security posture
 */
export class CorsConfig {
  /**
   * Get CORS options based on environment
   * @param origin CORS origin (configurable via CORS_ORIGIN env var)
   * @returns CorsOptions for app.enableCors()
   */
  static getOptions(origin?: string): CorsOptions {
    const corsOrigin = origin || process.env.CORS_ORIGIN || 'http://localhost:3000';

    return {
      // Restrict to specific origin (SECURITY FIX for Issue #2)
      origin: corsOrigin === '*' ? 'http://localhost:3000' : corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
      maxAge: 3600, // 1 hour
      optionsSuccessStatus: 200,
    };
  }

  /**
   * Validate CORS origin in production
   */
  static validateOrigin(origin: string): boolean {
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = (process.env.CORS_ORIGINS || 'https://yourdomain.com').split(',');
      return allowedOrigins.includes(origin);
    }
    return true;
  }

  /**
   * Get list of allowed origins
   */
  static getAllowedOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000';
    return origins.split(',').map(o => o.trim());
  }
}
