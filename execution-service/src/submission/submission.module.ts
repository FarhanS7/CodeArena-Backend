import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Judge0Service } from '../judge0/judge0.service';
import { Submission } from './entities/submission.entity';
import { SubmissionController } from './submission.controller';
import { SubmissionProcessor } from './submission.processor';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission]),
    BullModule.registerQueue(
      { name: 'leaderboard-queue' },
      { name: 'submission-queue' },
    ),
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService, Judge0Service, SubmissionProcessor],
  exports: [SubmissionService],
})
export class SubmissionModule {}
