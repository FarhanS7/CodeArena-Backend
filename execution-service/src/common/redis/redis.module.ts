import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_PUBLISHER',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.tls'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_PUBLISHER'],
})
export class RedisModule {}
