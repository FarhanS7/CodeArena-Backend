import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';

const rules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3007", description: "Port" },
  { key: "MEILI_HOST", required: true, description: "Meilisearch host" },
  { key: "MEILI_MASTER_KEY", required: false, defaultValue: "masterKey123", description: "Meilisearch master key" },
];

async function bootstrap() {
  EnvValidator.validate(rules);
  const logger = new Logger('SearchService');
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3007;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}
bootstrap().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
