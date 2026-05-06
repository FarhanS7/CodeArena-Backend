import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import envConfig from './config/env.config';
import { RealtimeGateway } from './realtime.gateway';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwtSecret'),
      }),
    }),
    RedisModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, RealtimeGateway],
})
export class AppModule {}
