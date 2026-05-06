import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';

const rules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3005", description: "Port" },
  { key: "REDIS_HOST", required: false, defaultValue: "localhost", description: "Redis host" },
  { key: "REDIS_PORT", required: false, defaultValue: "6379", description: "Redis port" },
  { key: "JWT_SECRET", required: true, description: "JWT secret" },
];

async function bootstrap() {
  EnvValidator.validate(rules);
  const logger = new Logger('RealtimeService');
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}
bootstrap().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
