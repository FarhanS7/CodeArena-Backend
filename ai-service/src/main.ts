import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';
import { CorsConfig } from '../shared-config/cors.config';

const rules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3006", description: "Port" },
  { key: "GEMINI_API_KEY", required: true, description: "Gemini API key" },
  { key: "PROBLEM_SERVICE_URL", required: true, description: "Problem service URL" },
];

async function bootstrap() {
  EnvValidator.validate(rules);
  const logger = new Logger('AIService');
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors(CorsConfig.getOptions());
  const port = process.env.PORT ?? 3006;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}
bootstrap().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
