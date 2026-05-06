import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';
import { CorsConfig } from './shared-config/cors.config';

const rules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3003", description: "Port" },
  { key: "DB_HOST", required: true, description: "DB host" },
  { key: "DB_PORT", required: true, description: "DB port" },
  { key: "DB_USERNAME", required: true, description: "DB user" },
  { key: "DB_PASSWORD", required: true, description: "DB password" },
  { key: "DB_DATABASE", required: true, description: "DB name" },
  { key: "REDIS_HOST", required: false, defaultValue: "localhost", description: "Redis host" },
  { key: "REDIS_PORT", required: false, defaultValue: "6379", description: "Redis port" },
];

async function bootstrap() {
  EnvValidator.validate(rules);
  const logger = new Logger('LeaderboardService');
  const app = await NestFactory.create(AppModule);
  app.enableCors(CorsConfig.getOptions());
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}
bootstrap().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
