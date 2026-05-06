import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserFollow } from './entities/user-follow.entity';
import { Notification } from './entities/notification.entity';
import { Achievement } from './entities/achievement.entity';
import { Activity } from './entities/activity.entity';
import { REDIS_PUBLISHER } from './common/redis/redis.provider';
import Redis from 'ioredis';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    @InjectRepository(UserFollow)
    private readonly followRepo: Repository<UserFollow>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @Inject(REDIS_PUBLISHER)
    private readonly redisPublisher: Redis,
  ) {}

  async createActivity(userId: string, type: string, content: string, metadata?: any) {
    const activity = this.activityRepo.create({ userId, type, content, metadata });
    return this.activityRepo.save(activity);
  }

  // FOLLOW METHODS
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new Error('Cannot follow yourself');
    
    await this.followRepo.save({ followerId, followingId });
    
    // Log activity
    await this.createActivity(followerId, 'FOLLOWED', `Started following ${followingId}`);
    
    // Notify user
    await this.createNotification(followingId, 'FOLLOW', `${followerId} started following you`);
    
    return { success: true };
  }

  async unfollowUser(followerId: string, followingId: string) {
    await this.followRepo.delete({ followerId, followingId });
    return { success: true };
  }

  async getFollowers(userId: string) {
    return this.followRepo.find({ where: { followingId: userId } });
  }

  async getFollowing(userId: string) {
    return this.followRepo.find({ where: { followerId: userId } });
  }

  // NOTIFICATION METHODS
  async createNotification(userId: string, type: string, message: string, data?: any) {
    const notification = this.notificationRepo.create({ userId, type, message, data });
    const saved = await this.notificationRepo.save(notification);
    
    // Broadcast for real-time service
    await this.redisPublisher.publish('notifications', JSON.stringify({
      userId,
      notification: saved,
    }));
    
    return saved;
  }

  async getNotifications(userId: string) {
    return this.notificationRepo.find({ 
      where: { userId }, 
      order: { createdAt: 'DESC' },
      take: 50 
    });
  }

  async markNotificationAsRead(id: number) {
    await this.notificationRepo.update(id, { read: true });
    return { success: true };
  }

  // ACHIEVEMENT METHODS
  async getAchievements(userId: string) {
    return this.achievementRepo.find({ where: { userId } });
  }

  async awardAchievement(userId: string, type: string, title: string) {
    const achievement = this.achievementRepo.create({ userId, achievementType: type, title });
    await this.achievementRepo.save(achievement);
    
    // Log activity
    await this.createActivity(userId, 'ACHIEVEMENT', `Earned achievement: ${title}`);
    
    await this.createNotification(userId, 'ACHIEVEMENT', `You earned a new achievement: ${title}`);
    
    return achievement;
  }

  // ACTIVITY FEED
  async getActivityFeed(userId: string) {
    // Get list of users this user follows
    const following = await this.followRepo.find({ where: { followerId: userId } });
    const followingIds = following.map(f => f.followingId);
    
    // Include the user themselves in the feed
    followingIds.push(userId);

    // Get activities for all these users
    return this.activityRepo.find({
      where: { userId: In(followingIds) },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
