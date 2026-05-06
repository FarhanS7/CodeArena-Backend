import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidator, EnvValidationRule } from './common/utils/env-validation.util';

// Define required environment variables
const envValidationRules: EnvValidationRule[] = [
  {
    key: "PORT",
    required: false,
    defaultValue: "3002",
    description: "Port to run the execution service on",
  },
  {
    key: "DB_HOST",
    required: true,
    description: "Database host (e.g., localhost or db.example.com)",
  },
  {
    key: "DB_PORT",
    required: true,
    description: "Database port (e.g., 5432)",
  },
  {
    key: "DB_USERNAME",
    required: true,
    description: "Database username",
  },
  {
    key: "DB_PASSWORD",
    required: true,
    description: "Database password",
  },
  {
    key: "DB_DATABASE",
    required: true,
    description: "Database name (e.g., execution_db)",
  },
  {
    key: "JUDGE0_URL",
    required: true,
    description: "Judge0 API endpoint URL",
  },
  {
    key: "JUDGE0_API_KEY",
    required: true,
    description: "Judge0 RapidAPI key",
  },
  {
    key: "JWT_SECRET",
    required: true,
    description: "Secret key for JWT validation",
  },
  {
    key: "REDIS_HOST",
    required: false,
    defaultValue: "localhost",
    description: "Redis host for job queue",
  },
  {
    key: "REDIS_PORT",
    required: false,
    defaultValue: "6379",
    description: "Redis port",
  },
];

async function bootstrap() {
  // Validate environment variables before creating NestJS app
  EnvValidator.validate(envValidationRules);

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('ExecutionService');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') || 3002;
  await app.listen(port);

  logger.log(`🚀 Execution Service running on: http://localhost:${port}/api`);
  logger.log(`📊 Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Execution Service:', error.message);
  process.exit(1);
});
