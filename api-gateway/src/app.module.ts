import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import proxy from 'express-http-proxy';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
    const problemServiceUrl = this.configService.get<string>('PROBLEM_SERVICE_URL', 'http://localhost:8080');
    const executionServiceUrl = this.configService.get<string>('EXECUTION_SERVICE_URL', 'http://localhost:3002');
    const leaderboardServiceUrl = this.configService.get<string>('LEADERBOARD_SERVICE_URL', 'http://localhost:3003');
    const discussionServiceUrl = this.configService.get<string>('DISCUSSION_SERVICE_URL', 'http://localhost:3004');
    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:3006');

    // Apply Correlation ID Middleware to all routes
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');

    const proxyOptions = {
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        // Forward the correlation ID header
        proxyReqOpts.headers['x-correlation-id'] = srcReq.headers['x-correlation-id'];
        // Forward the Authorization header if present
        if (srcReq.headers['authorization']) {
          proxyReqOpts.headers['authorization'] = srcReq.headers['authorization'];
        }
        return proxyReqOpts;
      },
      proxyReqPathResolver: (req) => req.url,
    };

    // Proxy Auth Service
    consumer
      .apply(proxy(authServiceUrl, proxyOptions))
      .forRoutes('auth');

    // Proxy Problem Service
    consumer
      .apply(proxy(problemServiceUrl, proxyOptions))
      .forRoutes('problems');

    // Proxy Execution Service
    consumer
      .apply(proxy(executionServiceUrl, proxyOptions))
      .forRoutes('submissions');

    // Proxy Leaderboard Service
    consumer
      .apply(proxy(leaderboardServiceUrl, proxyOptions))
      .forRoutes('leaderboard');

    // Proxy Discussion Service
    consumer
      .apply(proxy(discussionServiceUrl, proxyOptions))
      .forRoutes('discussions');

    // Proxy AI Service
    consumer
      .apply(proxy(aiServiceUrl, proxyOptions))
      .forRoutes('ai');
  }
}
