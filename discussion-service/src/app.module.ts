import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './common/guards/jwt.strategy';
import { DiscussionController } from './discussion/discussion.controller';
import { DiscussionService } from './discussion/discussion.service';
import { Comment } from './discussion/entities/comment.entity';

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
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'discussion_db'),
        entities: [Comment],
        synchronize: true, // Only for dev
      }),
    }),
    TypeOrmModule.forFeature([Comment]),
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService, JwtStrategy],
})
export class AppModule {}
