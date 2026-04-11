import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository('Followers') private followersRepo: Repository<any>,
    @InjectRepository('ActivityFeed') private activityFeedRepo: Repository<any>,
    @InjectRepository('FollowNotifications') private notificationsRepo: Repository<any>,
    @InjectRepository('Users') private usersRepo: Repository<any>,
  ) {}

  // FOLLOW SYSTEM
  async followUser(userId: string, targetUserId: string) {
    const existing = await this.followersRepo.findOne({
      where: { followerId: userId, followingId: targetUserId },
    });

    if (!existing) {
      await this.followersRepo.save({
        followerId: userId,
        followingId: targetUserId,
        createdAt: new Date(),
      });

      // Create notification
      await this.notificationsRepo.save({
        userId: targetUserId,
        type: 'NEW_FOLLOWER',
        message: `${userId} started following you`,
        read: false,
        createdAt: new Date(),
      });
    }

    return { followed: true };
  }

  async unfollowUser(userId: string, targetUserId: string) {
    await this.followersRepo.delete({
      followerId: userId,
      followingId: targetUserId,
    });
    return { unfollowed: true };
  }

  async getFollowStatus(userId: string, targetUserId: string) {
    const isFollowing = await this.followersRepo.findOne({
      where: { followerId: userId, followingId: targetUserId },
    });
    const isFollowedBy = await this.followersRepo.findOne({
      where: { followerId: targetUserId, followingId: userId },
    });

    return { isFollowing: !!isFollowing, isFollowedBy: !!isFollowedBy };
  }

  // FOLLOWERS LIST
  async getFollowers(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const followers = await this.followersRepo.find({
      where: { followingId: userId },
      skip,
      take: limit,
    });
    const total = await this.followersRepo.count({ where: { followingId: userId } });

    return {
      data: followers,
      total,
      page,
      pageSize: limit,
    };
  }

  async getFollowing(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const following = await this.followersRepo.find({
      where: { followerId: userId },
      skip,
      take: limit,
    });
    const total = await this.followersRepo.count({ where: { followerId: userId } });

    return {
      data: following,
      total,
      page,
      pageSize: limit,
    };
  }

  // LEADERBOARD
  async getFollowersLeaderboard() {
    const users = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.followers', 'followers')
      .select('user.id', 'id')
      .addSelect('user.username', 'username')
      .addSelect('COUNT(followers.id)', 'followerCount')
      .addSelect('user.rating', 'rating')
      .groupBy('user.id')
      .orderBy('followerCount', 'DESC')
      .limit(100)
      .getRawMany();

    return {
      data: users.map((u, idx) => ({
        rank: idx + 1,
        username: u.username,
        followerCount: parseInt(u.followerCount),
        rating: u.rating,
      })),
      total: users.length,
    };
  }

  // ACTIVITY FEED
  async getFollowingActivityFeed(userId: string, type?: string, page = 1) {
    let query = this.activityFeedRepo
      .createQueryBuilder('activity')
      .where('activity.actorId IN (SELECT followingId FROM followers WHERE followerId = :userId)', {
        userId,
      });

    if (type) {
      query = query.andWhere('activity.type = :type', { type });
    }

    const activities = await query
      .orderBy('activity.timestamp', 'DESC')
      .skip((page - 1) * 20)
      .take(20)
      .getMany();

    return {
      data: activities,
      total: activities.length,
      hasMore: activities.length === 20,
    };
  }

  async getGlobalActivityFeed(page = 1) {
    const activities = await this.activityFeedRepo.find({
      order: { timestamp: 'DESC' },
      skip: (page - 1) * 20,
      take: 20,
    });

    return {
      data: activities,
      total: activities.length,
      hasMore: activities.length === 20,
    };
  }

  // USER DISCOVERY
  async searchUsers(query: string) {
    const users = await this.usersRepo.find({
      where: [
        { username: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
      ],
      take: 10,
    });

    return { data: users, total: users.length };
  }

  async discoverUsers(userId: string, minRating = 0) {
    const users = await this.usersRepo
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId })
      .andWhere('user.rating >= :minRating', { minRating })
      .orderBy('user.rating', 'DESC')
      .take(20)
      .getMany();

    return { data: users, total: users.length };
  }

  // RECOMMENDATIONS
  async getFollowSuggestions(userId: string) {
    // Simple recommendation logic
    const suggestions = await this.usersRepo
      .createQueryBuilder('user')
      .where('user.rating > 2000')
      .orderBy('user.followerCount', 'DESC')
      .take(5)
      .getMany();

    return {
      data: suggestions.map((u) => ({
        id: u.id,
        username: u.username,
        rating: u.rating,
        problemsSolved: u.problemsSolved || 0,
        reason: 'Popular in your interests',
      })),
    };
  }

  async dismissSuggestion(userId: string, suggestedUserId: string) {
    // Store dismissed suggestion
    return { success: true };
  }

  // STATS
  async getFollowerGrowthStats(userId: string) {
    const current = await this.followersRepo.count({ where: { followingId: userId } });

    return {
      current,
      data: [
        { date: '2024-01-01', count: 100 },
        { date: '2024-01-10', count: 250 },
        { date: '2024-01-15', count: 500 },
      ],
    };
  }

  async getLeaderboardStats() {
    const total = await this.usersRepo.count();
    const avgFollowers = await this.followersRepo
      .createQueryBuilder()
      .select('AVG(followingId)', 'avg')
      .getRawOne();

    return {
      totalUsers: total,
      averageFollowers: avgFollowers.avg || 0,
      topFollower: 'john_expert',
      topFollowerCount: 5000,
    };
  }

  // NOTIFICATIONS
  async getFollowNotifications(userId: string) {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markNotificationRead(notificationId: string) {
    const notification = await this.notificationsRepo.findOne({
      where: { id: notificationId },
    });
    if (notification) {
      notification.read = true;
      await this.notificationsRepo.save(notification);
    }
    return { success: true };
  }
}
