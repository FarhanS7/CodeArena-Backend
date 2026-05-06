import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';

const rules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3000", description: "Gateway port" },
  { key: "AUTH_SERVICE_URL", required: true, description: "Auth service URL" },
  { key: "PROBLEM_SERVICE_URL", required: true, description: "Problem service URL" },
  { key: "EXECUTION_SERVICE_URL", required: true, description: "Execution service URL" },
  { key: "LEADERBOARD_SERVICE_URL", required: false, defaultValue: "http://localhost:3003", description: "Leaderboard service URL" },
  { key: "CONTEST_SERVICE_URL", required: false, defaultValue: "http://localhost:3008", description: "Contest service URL" },
  { key: "JWT_SECRET", required: true, description: "JWT secret" },
];

async function bootstrap() {
  EnvValidator.validate(rules);
  const logger = new Logger('APIGateway');
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  // CORS Middleware with configurable origin (ISSUE #2 FIX)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', corsOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-correlation-id');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  await app.listen(port);
  logger.log(`Running on port ${port}`);
  logger.log(`CORS origin: ${corsOrigin}`);
}
bootstrap().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
