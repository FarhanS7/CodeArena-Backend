import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { EnvValidator } from '../../shared-config/env-validation.util';
import { CorsConfig } from './shared-config/cors.config';

async function bootstrap() {
  const logger = new Logger('SocialService');
  
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors(CorsConfig.getOptions());
  
  const port = process.env.PORT || 3007;
  await app.listen(port);
  logger.log(`Social Service is running on port ${port}`);
}
bootstrap();
