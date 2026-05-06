import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { EnvValidator, EnvValidationRule } from '../../shared-config/env-validation.util';
import { CorsConfig } from './shared-config/cors.config';

const rules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3000", description: "Gateway port" },
  { key: "AUTH_SERVICE_URL", required: true, description: "Auth service URL" },
  { key: "PROBLEM_SERVICE_URL", required: true, description: "Problem service URL" },
  { key: "EXECUTION_SERVICE_URL", required: true, description: "Execution service URL" },
  { key: "JWT_SECRET", required: true, description: "JWT secret" },
];

async function bootstrap() {
  EnvValidator.validate(rules);
  const logger = new Logger('APIGateway');
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Use standardized CORS (Issue #2 FIX)
  app.enableCors(CorsConfig.getOptions());

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  await app.listen(port);
  logger.log(`Running on port ${port}`);
}

bootstrap().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
