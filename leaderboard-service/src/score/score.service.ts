import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { UserScore } from './entities/user-score.entity';

@Injectable()
export class ScoreService {
  private readonly logger = new Logger(ScoreService.name);
  private readonly GLOBAL_RANKING_KEY = 'leaderboard:global';

  private readonly USERNAME_MAP_KEY = 'leaderboard:usernames';

  constructor(
    @InjectRepository(UserScore)
    private userScoreRepository: Repository<UserScore>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async updateScore(userId: string, problemId: number, difficulty: string, username?: string): Promise<void> {
    this.logger.log(`Updating score for user ${userId} on problem ${problemId} (${difficulty})`);
    
    let userScore = await this.userScoreRepository.findOne({ where: { userId } });
    
    if (!userScore) {
      userScore = this.userScoreRepository.create({
        userId,
        username,
        score: 0,
        solvedCount: 0,
        solvedProblemIds: [],
      });
    }

    // Update username if provided and changed
    if (username && userScore.username !== username) {
      userScore.username = username;
      await this.redis.hset(this.USERNAME_MAP_KEY, userId, username);
    }

    // Don't award points if problem was already solved by this user
    if (userScore.solvedProblemIds.includes(problemId)) {
      this.logger.log(`User ${userId} already solved problem ${problemId}. No points awarded.`);
      return;
    }

    const points = this.calculatePoints(difficulty);
    userScore.score += points;
    userScore.solvedCount += 1;
    userScore.solvedProblemIds.push(problemId);

    await this.userScoreRepository.save(userScore);

    // Update Redis for fast ranking
    await this.redis.zadd(this.GLOBAL_RANKING_KEY, userScore.score, userId);
    if (userScore.username) {
      await this.redis.hset(this.USERNAME_MAP_KEY, userId, userScore.username);
    }
    
    this.logger.log(`Updated user ${userId} score to ${userScore.score}`);
  }

  async getGlobalRanking(limit: number = 10): Promise<any[]> {
    const topUsers = await this.redis.zrevrange(this.GLOBAL_RANKING_KEY, 0, limit - 1, 'WITHSCORES');
    
    const rankings: any[] = [];
    for (let i = 0; i < topUsers.length; i += 2) {
      const userId = topUsers[i];
      const score = parseInt(topUsers[i + 1], 10);
      const username = await this.redis.hget(this.USERNAME_MAP_KEY, userId);

      rankings.push({
        userId,
        username: username || 'Anonymous',
        score,
        rank: Math.floor(i / 2) + 1,
      });
    }
    
    return rankings;
  }

  async getUserRank(userId: string): Promise<any> {
    const score = await this.redis.zscore(this.GLOBAL_RANKING_KEY, userId);
    const rank = await this.redis.zrevrank(this.GLOBAL_RANKING_KEY, userId);
    
    if (score === null || rank === null) return { score: 0, rank: null };
    
    return {
      score: parseInt(score, 10),
      rank: rank + 1,
    };
  }

  private calculatePoints(difficulty: string): number {
    switch (difficulty.toUpperCase()) {
      case 'EASY': return 10;
      case 'MEDIUM': return 30;
      case 'HARD': return 50;
      default: return 5;
    }
  }
}
