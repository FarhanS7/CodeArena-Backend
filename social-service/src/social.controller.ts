import { Controller, Get, Post, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('feed')
  async getActivityFeed(@Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.socialService.getActivityFeed(userId);
  }

  // FOLLOW ENDPOINTS
  @Post('follow/:id')
  async followUser(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.socialService.followUser(userId, id);
  }

  @Delete('follow/:id')
  async unfollowUser(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.socialService.unfollowUser(userId, id);
  }

  @Get('followers/:id')
  async getFollowers(@Param('id') id: string) {
    return this.socialService.getFollowers(id);
  }

  @Get('following/:id')
  async getFollowing(@Param('id') id: string) {
    return this.socialService.getFollowing(id);
  }

  // NOTIFICATION ENDPOINTS
  @Get('notifications')
  async getNotifications(@Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.socialService.getNotifications(userId);
  }

  @Post('notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: number) {
    return this.socialService.markNotificationAsRead(id);
  }

  // ACHIEVEMENT ENDPOINTS
  @Get('achievements/:id')
  async getAchievements(@Param('id') id: string) {
    return this.socialService.getAchievements(id);
  }
}
