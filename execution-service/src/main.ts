import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

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
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') || 8081;
  await app.listen(port);

  logger.log(`🚀 Execution Service is running on: http://localhost:${port}/api`);
  logger.log(`📊 Health check: http://localhost:${port}/api/health`);
}

bootstrap();
