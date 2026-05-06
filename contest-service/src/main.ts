import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';

const envValidationRules: EnvValidationRule[] = [
  { key: "PORT", required: false, defaultValue: "3008", description: "Port to run the service on" },
  { key: "DB_HOST", required: true, description: "Database host" },
  { key: "DB_PORT", required: true, description: "Database port" },
  { key: "DB_USERNAME", required: true, description: "Database username" },
  { key: "DB_PASSWORD", required: true, description: "Database password" },
  { key: "DB_DATABASE", required: true, description: "Database name" },
  { key: "JWT_SECRET", required: true, description: "JWT secret key" },
  { key: "AUTH_SERVICE_URL", required: true, description: "Auth service URL" },
  { key: "PROBLEM_SERVICE_URL", required: true, description: "Problem service URL" },
  { key: "EXECUTION_SERVICE_URL", required: true, description: "Execution service URL" },
];

async function bootstrap() {
  EnvValidator.validate(envValidationRules);

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('ContestService');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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

  logger.log(`Running on: http://localhost:${port}/api`);
  logger.log(`API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start:', error.message);
  process.exit(1);
});
