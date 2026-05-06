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
    const contestServiceUrl = this.configService.get<string>('CONTEST_SERVICE_URL', 'http://localhost:3008');
    const searchServiceUrl = this.configService.get<string>('SEARCH_SERVICE_URL', 'http://localhost:3007');
    const emailServiceUrl = this.configService.get<string>('EMAIL_SERVICE_URL', 'http://localhost:3010');

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
      .forRoutes('api/auth');

    // Proxy User/Profile (part of auth service)
    consumer
      .apply(proxy(authServiceUrl, proxyOptions))
      .forRoutes('api/users');

    // Proxy Problem Service
    consumer
      .apply(proxy(problemServiceUrl, proxyOptions))
      .forRoutes('api/problems');

    // Proxy Execution Service
    consumer
      .apply(
        proxy(executionServiceUrl, {
          ...proxyOptions,
          proxyReqPathResolver: (req) => {
            const suffix = req.url === '/' ? '' : req.url;
            return `/api/submissions${suffix}`;
          },
        }),
      )
      .forRoutes('api/submissions');

    // Proxy Leaderboard Service
    consumer
      .apply(proxy(leaderboardServiceUrl, proxyOptions))
      .forRoutes('api/leaderboard');

    // Proxy Discussion Service
    consumer
      .apply(proxy(discussionServiceUrl, proxyOptions))
      .forRoutes('api/discussions');

    // Proxy AI Service
    consumer
      .apply(proxy(aiServiceUrl, proxyOptions))
      .forRoutes('api/ai');

    // Proxy Contest Service
    consumer
      .apply(proxy(contestServiceUrl, proxyOptions))
      .forRoutes('api/contests');

    // Proxy Search Service
    consumer
      .apply(proxy(searchServiceUrl, proxyOptions))
      .forRoutes('api/search');

    // Proxy Email Service
    consumer
      .apply(proxy(emailServiceUrl, proxyOptions))
      .forRoutes('api/email');
    
    // Proxy Social Service
    consumer
      .apply(proxy(this.configService.get('SOCIAL_SERVICE_URL', 'http://localhost:3009'), proxyOptions))
      .forRoutes('api/social');
  }
}
