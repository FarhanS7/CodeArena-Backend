import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('SearchService');
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3007;
  await app.listen(port);
  logger.log(`Search Service is running on: http://localhost:${port}`);
}
bootstrap();
