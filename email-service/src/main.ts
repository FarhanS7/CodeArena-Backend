import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('EmailService');
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3010;
  await app.listen(port);
  logger.log(`Email Service is running on: http://localhost:${port}`);
}
bootstrap();
