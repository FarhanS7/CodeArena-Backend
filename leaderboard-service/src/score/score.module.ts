import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserScore } from './entities/user-score.entity';
import { ScoreController } from './score.controller';
import { ScoreProcessor } from './score.processor';
import { ScoreService } from './score.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserScore]),
    BullModule.registerQueue({
      name: 'leaderboard-queue',
    }),
  ],
  controllers: [ScoreController],
  providers: [ScoreService, ScoreProcessor],
  exports: [ScoreService],
})
export class ScoreModule {}
