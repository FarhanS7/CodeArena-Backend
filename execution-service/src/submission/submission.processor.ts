import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SubmissionService } from './submission.service';

@Processor('submission-queue')
export class SubmissionProcessor {
  private readonly logger = new Logger(SubmissionProcessor.name);

  constructor(private readonly submissionService: SubmissionService) {}

  @Process('process')
  async handleProcess(job: Job<{ submissionId: number }>) {
    const { submissionId } = job.data;
    this.logger.log(`Processing job ${job.id} for submission ${submissionId}`);
    
    try {
      await this.submissionService.processSubmission(submissionId);
    } catch (error) {
      this.logger.error(`Failed to process submission ${submissionId}: ${error.message}`);
      throw error; // Rethrow to allow Bull to retry based on configuration
    }
  }
}
