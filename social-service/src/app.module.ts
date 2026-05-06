import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { UserFollow } from './entities/user-follow.entity';
import { Notification } from './entities/notification.entity';
import { Achievement } from './entities/achievement.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserFollow, Notification, Achievement]),
  ],
  controllers: [SocialController],
  providers: [SocialService],
})
export class AppModule {}
