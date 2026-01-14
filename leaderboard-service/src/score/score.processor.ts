import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ScoreService } from './score.service';

@Processor('leaderboard-queue')
export class ScoreProcessor {
  private readonly logger = new Logger(ScoreProcessor.name);

  constructor(private readonly scoreService: ScoreService) {}

  @Process('submission.accepted')
  async handleSubmissionAccepted(job: Job<any>) {
    this.logger.log(`Processing leaderboard update for job ${job.id}`);
    const { userId, problemId, difficulty } = job.data;
    
    try {
      await this.scoreService.updateScore(userId, problemId, difficulty);
      this.logger.log(`Leaderboard updated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update leaderboard: ${error.message}`);
      throw error;
    }
  }
}
