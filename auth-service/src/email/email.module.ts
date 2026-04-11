import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

export interface EmailConfig {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

@Module({
  controllers: [EmailController],
  providers: [
    {
      provide: 'EMAIL_SERVICE',
      useFactory: (configService: ConfigService) => {
        const emailConfig: EmailConfig = {
          from: configService.get<string>('EMAIL_FROM') || 'noreply@codearena.com',
          host: configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
          port: configService.get<number>('EMAIL_PORT') || 587,
          secure: configService.get<boolean>('EMAIL_SECURE') || false,
          auth: {
            user: configService.get<string>('EMAIL_USER') || '',
            pass: configService.get<string>('EMAIL_PASSWORD') || '',
          },
        };

        const transporter = nodemailer.createTransport(emailConfig);
        return transporter;
      },
      inject: [ConfigService],
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
