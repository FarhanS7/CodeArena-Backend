import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_PUBLISHER = 'REDIS_PUBLISHER';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

export const RedisProvider: Provider[] = [
  {
    provide: REDIS_PUBLISHER,
    useFactory: (configService: ConfigService) => {
      return new Redis({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
      });
    },
    inject: [ConfigService],
  },
  {
    provide: REDIS_SUBSCRIBER,
    useFactory: (configService: ConfigService) => {
      return new Redis({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
      });
    },
    inject: [ConfigService],
  },
];
