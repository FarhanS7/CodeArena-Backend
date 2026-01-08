import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Enable CORS for frontend integration
  app.enableCors();

  await app.listen(port);
  logger.log(`API Gateway is running on: http://localhost:${port}`);
  logger.log(`Routing /auth/** -> ${configService.get('AUTH_SERVICE_URL', 'http://localhost:3001')}`);
  logger.log(`Routing /problems/** -> ${configService.get('PROBLEM_SERVICE_URL', 'http://localhost:8080')}`);
  logger.log(`Routing /submissions/** -> ${configService.get('EXECUTION_SERVICE_URL', 'http://localhost:3002')}`);
}
bootstrap();
