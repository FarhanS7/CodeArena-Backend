import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from './entities/user-follow.entity';
import { Notification } from './entities/notification.entity';
import { Achievement } from './entities/achievement.entity';

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
  ) {}

  // FOLLOW METHODS
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new Error('Cannot follow yourself');
    
    await this.followRepo.save({ followerId, followingId });
    
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
    return this.notificationRepo.save(notification);
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
    
    await this.createNotification(userId, 'ACHIEVEMENT', `You earned a new achievement: ${title}`);
    
    return achievement;
  }
}
