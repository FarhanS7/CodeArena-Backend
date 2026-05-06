import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';
import { CorsConfig } from '../shared-config/cors.config';

const envValidationRules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3008", description: "Port" },
  { key: "DB_HOST", required: true, description: "DB host" },
  { key: "DB_PORT", required: true, description: "DB port" },
  { key: "DB_USERNAME", required: true, description: "DB user" },
  { key: "DB_PASSWORD", required: true, description: "DB password" },
  { key: "DB_DATABASE", required: true, description: "DB name" },
  { key: "JWT_SECRET", required: true, description: "JWT secret" },
];

async function bootstrap() {
  EnvValidator.validate(envValidationRules);
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('ContestService');

  app.enableCors(CorsConfig.getOptions());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Contest Service API')
    .setDescription('Code Arena Contest Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3008);
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
