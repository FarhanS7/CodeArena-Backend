import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailService } from './email.service';

@Controller('api/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // EMAIL PREFERENCES
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Request() req) {
    return this.emailService.getEmailPreferences(req.user.id);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Request() req,
    @Body() dto: { [key: string]: boolean },
  ) {
    return this.emailService.updateEmailPreferences(req.user.id, dto);
  }

  @Put('frequency')
  @UseGuards(JwtAuthGuard)
  async updateFrequency(
    @Request() req,
    @Body() dto: { frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' },
  ) {
    return this.emailService.updateEmailFrequency(req.user.id, dto.frequency);
  }

  @Put('address')
  @UseGuards(JwtAuthGuard)
  async updateEmail(@Request() req, @Body() dto: { email: string }) {
    return this.emailService.updateEmail(req.user.id, dto.email);
  }

  // EMAIL VERIFICATION
  @Post('verify-send')
  @UseGuards(JwtAuthGuard)
  async sendVerificationEmail(@Request() req) {
    return this.emailService.sendVerificationEmail(req.user.id);
  }

  @Post('verify/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.emailService.verifyEmail(token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  async resendVerification(@Request() req) {
    return this.emailService.resendVerificationEmail(req.user.id);
  }

  // DIGEST
  @Get('digest/preview')
  @UseGuards(JwtAuthGuard)
  async getDigestPreview(@Request() req) {
    return this.emailService.generateDigestPreview(req.user.id);
  }

  @Put('digest-day')
  @UseGuards(JwtAuthGuard)
  async updateDigestDay(@Request() req, @Body() dto: { day: string }) {
    return this.emailService.updateDigestDay(req.user.id, dto.day);
  }

  // UNSUBSCRIBE
  @Post('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string) {
    return this.emailService.unsubscribeEmail(token);
  }

  @Post('unsubscribe-all')
  @UseGuards(JwtAuthGuard)
  async unsubscribeAll(@Request() req) {
    return this.emailService.unsubscribeAll(req.user.id);
  }

  // ADMIN: TEMPLATES
  @Get('templates')
  async getEmailTemplates() {
    return this.emailService.getEmailTemplates();
  }

  @Put('templates/:templateId')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: { content: string },
  ) {
    return this.emailService.updateEmailTemplate(templateId, dto.content);
  }

  // ADMIN: ANALYTICS
  @Get('analytics')
  async getEmailAnalytics() {
    return this.emailService.getEmailAnalytics();
  }

  @Get('history')
  async getEmailHistory() {
    return this.emailService.getEmailHistory();
  }

  @Post('export')
  async exportEmailReports() {
    return this.emailService.exportEmailReports();
  }
}
