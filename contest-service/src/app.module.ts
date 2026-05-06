import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ContestController } from './controllers/contest.controller';
import { ContestService } from './services/contest.service';
import { Contest } from './entities/contest.entity';
import { ContestParticipant } from './entities/contest-participant.entity';
import { ContestProblem } from './entities/contest-problem.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        host: !configService.get('DATABASE_URL') ? configService.get('DB_HOST', 'localhost') : undefined,
        port: !configService.get('DATABASE_URL') ? configService.get('DB_PORT', 5432) : undefined,
        username: !configService.get('DATABASE_URL') ? configService.get('DB_USERNAME', 'postgres') : undefined,
        password: !configService.get('DATABASE_URL') ? configService.get('DB_PASSWORD', 'postgres') : undefined,
        database: !configService.get('DATABASE_URL') ? configService.get('DB_DATABASE', 'contest_db') : undefined,
        entities: [Contest, ContestParticipant, ContestProblem],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Contest, ContestParticipant, ContestProblem]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key-change-this'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [ContestController],
  providers: [ContestService],
  exports: [ContestService],
})
export class AppModule {}