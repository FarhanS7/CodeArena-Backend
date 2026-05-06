import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';

const envValidationRules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3003", description: "Port to run on" },
  { key: "DB_HOST", required: true, description: "Database host" },
  { key: "DB_PORT", required: true, description: "Database port" },
  { key: "DB_USERNAME", required: true, description: "Database username" },
  { key: "DB_PASSWORD", required: true, description: "Database password" },
  { key: "DB_DATABASE", required: true, description: "Database name" },
  { key: "REDIS_HOST", required: false, defaultValue: "localhost", description: "Redis host" },
  { key: "REDIS_PORT", required: false, defaultValue: "6379", description: "Redis port" },
];

async function bootstrap() {
  EnvValidator.validate(envValidationRules);
  const logger = new Logger('LeaderboardService');
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}
bootstrap().catch((error) => {
  console.error('Failed to start:', error.message);
  process.exit(1);
});
