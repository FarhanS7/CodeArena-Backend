import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';
import { CorsConfig } from './shared-config/cors.config';

const rules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3010", description: "Port" },
  { key: "REDIS_HOST", required: false, defaultValue: "localhost", description: "Redis host" },
  { key: "REDIS_PORT", required: false, defaultValue: "6379", description: "Redis port" },
];

async function bootstrap() {
  EnvValidator.validate(rules);
  const logger = new Logger('EmailService');
  const app = await NestFactory.create(AppModule);
  app.enableCors(CorsConfig.getOptions());
  const port = process.env.PORT || 3010;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}
bootstrap().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
