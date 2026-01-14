import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Judge0Service } from '../judge0/judge0.service';
import { Submission } from './entities/submission.entity';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission]),
    BullModule.registerQueue({
      name: 'leaderboard-queue',
    }),
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService, Judge0Service],
  exports: [SubmissionService],
})
export class SubmissionModule {}
