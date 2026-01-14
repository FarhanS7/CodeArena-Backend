import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import proxy from 'express-http-proxy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
    const problemServiceUrl = this.configService.get<string>('PROBLEM_SERVICE_URL', 'http://localhost:8080');
    const executionServiceUrl = this.configService.get<string>('EXECUTION_SERVICE_URL', 'http://localhost:3002');
    const leaderboardServiceUrl = this.configService.get<string>('LEADERBOARD_SERVICE_URL', 'http://localhost:3003');

    // Proxy Auth Service
    consumer
      .apply(proxy(authServiceUrl, {
        proxyReqPathResolver: (req) => {
          return req.url; // Keeps the path as is (e.g., /auth/login)
        }
      }))
      .forRoutes('auth');

    // Proxy Problem Service
    consumer
      .apply(proxy(problemServiceUrl, {
        proxyReqPathResolver: (req) => {
          return req.url;
        }
      }))
      .forRoutes('problems');

    // Proxy Execution Service
    consumer
      .apply(proxy(executionServiceUrl, {
        proxyReqPathResolver: (req) => {
          return req.url;
        }
      }))
      .forRoutes('submissions');

    // Proxy Leaderboard Service
    consumer
      .apply(proxy(leaderboardServiceUrl, {
        proxyReqPathResolver: (req) => {
          return req.url;
        }
      }))
      .forRoutes('leaderboard');
  }
}
