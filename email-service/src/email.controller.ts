import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-verification')
  async sendVerificationEmail(@Body() dto: { to: string; token: string }) {
    return this.emailService.queueVerificationEmail(dto.to, dto.token);
  }

  @Post('send-reset-password')
  async sendResetPassword(@Body() dto: { to: string; token: string }) {
    return this.emailService.queueResetPasswordEmail(dto.to, dto.token);
  }

  @Post('send-contest-reminder')
  async sendContestReminder(@Body() dto: { to: string; contestName: string; startTime: string }) {
    return this.emailService.queueContestReminder(dto.to, dto.contestName, dto.startTime);
  }
}
