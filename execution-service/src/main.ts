import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';
import { CorsConfig } from '../shared-config/cors.config';

const envValidationRules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3002", description: "Port" },
  { key: "DB_HOST", required: true, description: "DB host" },
  { key: "DB_PORT", required: true, description: "DB port" },
  { key: "DB_USERNAME", required: true, description: "DB user" },
  { key: "DB_PASSWORD", required: true, description: "DB password" },
  { key: "DB_DATABASE", required: true, description: "DB name" },
  { key: "JUDGE0_URL", required: true, description: "Judge0 URL" },
  { key: "JUDGE0_API_KEY", required: true, description: "Judge0 API key" },
  { key: "JWT_SECRET", required: true, description: "JWT secret" },
  { key: "REDIS_HOST", required: false, defaultValue: "localhost", description: "Redis host" },
  { key: "REDIS_PORT", required: false, defaultValue: "6379", description: "Redis port" },
];

async function bootstrap() {
  EnvValidator.validate(envValidationRules);
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('ExecutionService');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors(CorsConfig.getOptions());
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') || 3002;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
