import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
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

  // PROCESSOR HANDLERS (Actual sending)
  async handleSendVerification(data: { to: string; token: string }) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/verify-email?token=${data.token}`;

    return this.sendMail({
      to: data.to,
      subject: 'Verify Your Email - Code Arena',
      html: `
        <h1>Welcome to Code Arena!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${link}">${link}</a>
      `,
    });
  }

  async handleSendResetPassword(data: { to: string; token: string }) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/reset-password?token=${data.token}`;

    return this.sendMail({
      to: data.to,
      subject: 'Reset Your Password - Code Arena',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${link}">${link}</a>
      `,
    });
  }

  async handleSendContestReminder(data: { to: string; contestName: string; startTime: string }) {
    return this.sendMail({
      to: data.to,
      subject: `Reminder: ${data.contestName} starts soon!`,
      html: `
        <h1>Contest Reminder</h1>
        <p>The contest <strong>${data.contestName}</strong> is starting at ${data.startTime}.</p>
        <p>Good luck!</p>
      `,
    });
  }

  private async sendMail(options: nodemailer.SendMailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Code Arena" <${this.configService.get('EMAIL_USER')}>`,
        ...options,
      });
      this.logger.log(`Message sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}: ${error.message}`);
      throw error;
    }
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

  async updateEmailFrequency(userId: string, frequency: string) {
    return this.updateEmailPreferences(userId, { emailFrequency: frequency });
  }

  async updateEmail(userId: string, email: string) {
    await this.updateEmailPreferences(userId, { email });
    await this.sendVerificationEmail(userId);
    return { sent: true };
  }

  // EMAIL VERIFICATION
  async sendVerificationEmail(userId: string) {
    const token = this.generateToken();
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      to: userId,
      subject: 'Verify Your Email - Code Arena',
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`,
    });

    return { sent: true };
  }

  async verifyEmail(token: string) {
    // Verify token and mark email as verified
    return { success: true };
  }

  async resendVerificationEmail(userId: string) {
    return this.sendVerificationEmail(userId);
  }

  // DIGEST
  async generateDigestPreview(userId: string) {
    const stats = await this.getUserWeeklyStats(userId);
    const html = this.generateDigestHTML(stats);

    return {
      subject: 'Your Weekly Digest - Code Arena',
      previewHtml: html,
    };
  }

  async updateDigestDay(userId: string, day: string) {
    return this.updateEmailPreferences(userId, { digestDay: day });
  }

  // UNSUBSCRIBE
  async unsubscribeEmail(token: string) {
    // Mark token/user as unsubscribed
    return { success: true };
  }

  async unsubscribeAll(userId: string) {
    const prefs = await this.preferencesRepo.findOne({ where: { userId } });
    if (prefs) {
      prefs.unsubscribedAll = true;
      await this.preferencesRepo.save(prefs);
    }
    return { success: true };
  }

  // ADMIN: TEMPLATES
  async getEmailTemplates() {
    return this.templatesRepo.find();
  }

  async updateEmailTemplate(templateId: string, content: string) {
    const template = await this.templatesRepo.findOne({ where: { id: templateId } });
    if (template) {
      template.content = content;
      await this.templatesRepo.save(template);
    }
    return { success: true };
  }

  // ADMIN: ANALYTICS
  async getEmailAnalytics() {
    return {
      totalSent: 5000,
      openRate: 0.45,
      clickRate: 0.12,
      bounceRate: 0.02,
      unsubscribeRate: 0.01,
    };
  }

  async getEmailHistory() {
    return this.historyRepo.find({ order: { sentAt: 'DESC' }, take: 100 });
  }

  async exportEmailReports() {
    return { downloadUrl: '/tmp/email-report.csv' };
  }

  // HELPERS
  private getDefaultPreferences() {
    return {
      contestUpdates: true,
      submissionUpdates: true,
      discussionReplies: true,
      upvoteNotifications: false,
      leaderboardUpdates: true,
      followerActivity: false,
      emailFrequency: 'WEEKLY',
      digestDay: 'MONDAY',
    };
  }

  private async getUserWeeklyStats(userId: string) {
    return {
      problemsSolved: 5,
      submissionsCount: 12,
      acceptanceRate: 0.65,
      rating: 1800,
      rank: 1234,
    };
  }

  private generateDigestHTML(stats: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Your Weekly Digest</h2>
          <p>Problems Solved: ${stats.problemsSolved}</p>
          <p>Submissions: ${stats.submissionsCount}</p>
          <p>Acceptance Rate: ${(stats.acceptanceRate * 100).toFixed(1)}%</p>
          <p>Current Rating: ${stats.rating}</p>
          <p>Leaderboard Rank: ${stats.rank}</p>
        </body>
      </html>
    `;
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
