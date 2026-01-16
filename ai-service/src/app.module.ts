import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { JwtStrategy } from './common/guards/jwt.strategy';
import envConfig from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'supersecretkeythatshouldbechangedinproduction'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AiController],
  providers: [AiService, JwtStrategy],
})
export class AppModule {}
