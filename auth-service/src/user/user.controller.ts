import { Controller, ForbiddenException, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from './user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * DEVELOPMENT ONLY: Promote a user to ADMIN role
   */
  @Patch(':id/promote-admin')
  @UseGuards(JwtAuthGuard)
  async promoteToAdmin(@Param('id') userId: string, @Req() req) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('This endpoint is disabled in production');
    }

    if (req.user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.role = Role.ADMIN;
    await this.userService.updateUser(user);

    return {
      message: 'User promoted to ADMIN successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }
}
