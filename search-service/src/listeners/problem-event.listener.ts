import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_SUBSCRIBER } from '../common/redis/redis.provider';
import { SearchService } from '../search.service';

@Injectable()
export class ProblemEventListener implements OnModuleInit {
  private readonly logger = new Logger(ProblemEventListener.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly redisSubscriber: Redis,
    private readonly searchService: SearchService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Redis event listener for problem-events...');
    
    await this.redisSubscriber.subscribe('problem-events');

    this.redisSubscriber.on('message', async (channel, message) => {
      if (channel === 'problem-events') {
        try {
          const event = JSON.parse(message);
          this.logger.log(`Received event: ${event.event}`);
          
          switch (event.event) {
            case 'PROBLEM_CREATED':
            case 'PROBLEM_UPDATED':
              await this.searchService.indexProblem(event.data);
              this.logger.log(`Indexed problem: ${event.data.id}`);
              break;
            case 'PROBLEM_DELETED':
              await this.searchService.deleteProblem(event.data.id);
              this.logger.log(`Deleted problem from index: ${event.data.id}`);
              break;
            default:
              this.logger.warn(`Unknown event type: ${event.event}`);
          }
        } catch (err) {
          this.logger.error(`Failed to process problem event: ${err.message}`);
        }
      }
    });
  }
}
