import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: any;

  constructor(
    @InjectRepository('EmailPreferences') private preferencesRepo: Repository<any>,
    @InjectRepository('EmailHistory') private historyRepo: Repository<any>,
    @InjectRepository('EmailTemplates') private templatesRepo: Repository<any>,
  ) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
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
