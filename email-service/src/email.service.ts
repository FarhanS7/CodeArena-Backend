import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { EmailPreference } from './entities/email-preference.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailHistory } from './entities/email-history.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectRepository(EmailPreference)
    private readonly preferencesRepo: Repository<EmailPreference>,
    @InjectRepository(EmailTemplate)
    private readonly templatesRepo: Repository<EmailTemplate>,
    @InjectRepository(EmailHistory)
    private readonly historyRepo: Repository<EmailHistory>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  // PUBLIC QUEUE METHODS
  async queueVerificationEmail(to: string, token: string) {
    await this.emailQueue.add('send-verification', { to, token });
    return { queued: true };
  }

  async queueResetPasswordEmail(to: string, token: string) {
    await this.emailQueue.add('send-reset-password', { to, token });
    return { queued: true };
  }

  async queueContestReminder(to: string, contestName: string, startTime: string) {
    await this.emailQueue.add('send-contest-reminder', { to, contestName, startTime });
    return { queued: true };
  }

  // PROCESSOR HANDLERS
  async handleSendVerification(data: { to: string; token: string }) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/verify-email?token=${data.token}`;

    return this.sendMail({
      to: data.to,
      subject: 'Verify Your Email - Code Arena',
      html: `<h1>Welcome!</h1><p>Verify your email: <a href="${link}">${link}</a></p>`,
    });
  }

  async handleSendResetPassword(data: { to: string; token: string }) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/reset-password?token=${data.token}`;

    return this.sendMail({
      to: data.to,
      subject: 'Reset Your Password - Code Arena',
      html: `<h1>Reset Password</h1><p>Link: <a href="${link}">${link}</a></p>`,
    });
  }

  async handleSendContestReminder(data: { to: string; contestName: string; startTime: string }) {
    return this.sendMail({
      to: data.to,
      subject: `Reminder: ${data.contestName} starts soon!`,
      html: `<h1>Contest Reminder</h1><p>${data.contestName} starts at ${data.startTime}</p>`,
    });
  }

  private async sendMail(options: nodemailer.SendMailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Code Arena" <${this.configService.get('EMAIL_USER')}>`,
        ...options,
      });
      this.logger.log(`Message sent: ${info.messageId}`);
      
      // Log to history
      await this.historyRepo.save({
        userId: 'system', // or extract from data
        to: options.to as string,
        subject: options.subject,
        messageId: info.messageId,
        status: 'SENT',
      });

      return info;
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}: ${error.message}`);
      throw error;
    }
  }

  // EMAIL PREFERENCES
  async getEmailPreferences(userId: string) {
    const prefs = await this.preferencesRepo.findOne({ where: { userId } });
    return prefs || this.getDefaultPreferences();
  }

  async updateEmailPreferences(userId: string, preferences: any) {
    const existing = await this.preferencesRepo.findOne({ where: { userId } });
    if (existing) {
      Object.assign(existing, preferences);
      await this.preferencesRepo.save(existing);
    } else {
      await this.preferencesRepo.save({ userId, ...preferences });
    }
    return { success: true };
  }

  // ADMIN: ANALYTICS
  async getEmailAnalytics() {
    const totalSent = await this.historyRepo.count();
    return {
      totalSent,
      openRate: 0.45,
      clickRate: 0.12,
      bounceRate: 0.02,
    };
  }

  private getDefaultPreferences() {
    return {
      contestUpdates: true,
      submissionUpdates: true,
      discussionReplies: true,
      emailFrequency: 'WEEKLY',
    };
  }
}
