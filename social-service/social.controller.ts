import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SocialService } from './social.service';

@Controller('api/users')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // FOLLOW SYSTEM
  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Request() req, @Param('userId') userId: string) {
    return this.socialService.followUser(req.user.id, userId);
  }

  @Delete(':userId/unfollow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Request() req, @Param('userId') userId: string) {
    return this.socialService.unfollowUser(req.user.id, userId);
  }

  @Get(':userId/follow-status')
  @UseGuards(JwtAuthGuard)
  async getFollowStatus(@Request() req, @Param('userId') userId: string) {
    return this.socialService.getFollowStatus(req.user.id, userId);
  }

  // FOLLOWERS LIST
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
  ) {
    return this.socialService.getFollowers(userId, page);
  }

  @Get(':userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
  ) {
    return this.socialService.getFollowing(userId, page);
  }

  // LEADERBOARD
  @Get('leaderboard/followers')
  async getFollowersLeaderboard() {
    return this.socialService.getFollowersLeaderboard();
  }

  // ACTIVITY FEED
  @Get('feed/following')
  @UseGuards(JwtAuthGuard)
  async getFollowingActivityFeed(
    @Request() req,
    @Query('type') type?: string,
    @Query('page') page: number = 1,
  ) {
    return this.socialService.getFollowingActivityFeed(req.user.id, type, page);
  }

  @Get('feed/global')
  async getGlobalActivityFeed(@Query('page') page: number = 1) {
    return this.socialService.getGlobalActivityFeed(page);
  }

  // USER DISCOVERY
  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.socialService.searchUsers(query);
  }

  @Get('discover')
  @UseGuards(JwtAuthGuard)
  async discoverUsers(
    @Request() req,
    @Query('minRating') minRating: number = 0,
  ) {
    return this.socialService.discoverUsers(req.user.id, minRating);
  }

  // RECOMMENDATIONS
  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  async getFollowSuggestions(@Request() req) {
    return this.socialService.getFollowSuggestions(req.user.id);
  }

  @Post('suggestions/:suggestedUserId/dismiss')
  @UseGuards(JwtAuthGuard)
  async dismissSuggestion(
    @Request() req,
    @Param('suggestedUserId') suggestedUserId: string,
  ) {
    return this.socialService.dismissSuggestion(req.user.id, suggestedUserId);
  }

  // STATS
  @Get(':userId/stats/followers')
  async getFollowerStats(@Param('userId') userId: string) {
    return this.socialService.getFollowerGrowthStats(userId);
  }

  @Get('leaderboard/stats')
  async getLeaderboardStats() {
    return this.socialService.getLeaderboardStats();
  }

  // NOTIFICATIONS
  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getFollowNotifications(@Request() req) {
    return this.socialService.getFollowNotifications(req.user.id);
  }

  @Put('notifications/:notificationId/read')
  @UseGuards(JwtAuthGuard)
  async markNotificationRead(@Param('notificationId') notificationId: string) {
    return this.socialService.markNotificationRead(notificationId);
  }
}
