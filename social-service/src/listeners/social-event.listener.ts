import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_SUBSCRIBER } from '../common/redis/redis.provider';
import { SocialService } from '../social.service';

@Injectable()
export class SocialEventListener implements OnModuleInit {
  private readonly logger = new Logger(SocialEventListener.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly redisSubscriber: Redis,
    private readonly socialService: SocialService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Redis event listener for social-events...');
    
    // Subscribe to submission verdicts to award achievements
    await this.redisSubscriber.subscribe('submission-verdicts');

    this.redisSubscriber.on('message', async (channel, message) => {
      if (channel === 'submission-verdicts') {
        try {
          const data = JSON.parse(message);
          
          if (data.status === 'ACCEPTED') {
            this.logger.log(`Processing AC for user ${data.userId} to check achievements`);
            await this.socialService.awardAchievement(data.userId, 'PROBLEM_SOLVED', 'Solver of Code');
          }
        } catch (err) {
          this.logger.error(`Failed to process social event: ${err.message}`);
        }
      }
    });
  }
}
