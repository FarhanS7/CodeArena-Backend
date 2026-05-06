import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './common/guards/jwt.strategy';
import { DiscussionController } from './discussion/discussion.controller';
import { DiscussionService } from './discussion/discussion.service';
import { Comment } from './discussion/entities/comment.entity';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'supersecretkeythatshouldbechangedinproduction'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        host: !config.get('DATABASE_URL') ? config.get<string>('DB_HOST', 'localhost') : undefined,
        port: !config.get('DATABASE_URL') ? config.get<number>('DB_PORT', 5432) : undefined,
        username: !config.get('DATABASE_URL') ? config.get<string>('DB_USERNAME', 'postgres') : undefined,
        password: !config.get('DATABASE_URL') ? config.get<string>('DB_PASSWORD', 'postgres') : undefined,
        database: !config.get('DATABASE_URL') ? config.get<string>('DB_DATABASE', 'discussion_db') : undefined,
        entities: [Comment],
        synchronize: true, // Only for dev
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
    }),
    TypeOrmModule.forFeature([Comment]),
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService, JwtStrategy],
})
export class AppModule {}
