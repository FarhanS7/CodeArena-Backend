import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@Req() req) {
    const user = await this.userService.findById(req.user.sub);
    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  @Patch()
  async updateProfile(@Req() req, @Body() updateData: any) {
    const userId = req.user.sub;
    // Basic filtering to prevent arbitrary updates (should use a DTO in production)
    const allowedFields = ['bio', 'avatarUrl', 'socialLinks', 'username'];
    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    await this.userService.updateUser({ id: userId, ...filteredData });
    return this.userService.findById(userId);
  }
}
