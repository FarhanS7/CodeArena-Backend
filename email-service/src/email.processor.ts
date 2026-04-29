import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing email job: ${job.name} for ${job.data.to}`);
    
    switch (job.name) {
      case 'send-verification':
        return this.emailService.handleSendVerification(job.data);
      case 'send-reset-password':
        return this.emailService.handleSendResetPassword(job.data);
      case 'send-contest-reminder':
        return this.emailService.handleSendContestReminder(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
