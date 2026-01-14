import { Controller, Get, Param, Query } from '@nestjs/common';
import { ScoreService } from './score.service';

@Controller('leaderboard')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get('global')
  async getGlobalRanking(@Query('limit') limit?: number) {
    return {
      success: true,
      data: await this.scoreService.getGlobalRanking(limit ? parseInt(limit.toString()) : 10),
    };
  }

  @Get('user/:userId')
  async getUserRank(@Param('userId') userId: string) {
    return {
      success: true,
      data: await this.scoreService.getUserRank(userId),
    };
  }
}
