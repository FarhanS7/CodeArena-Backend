import { Controller, Param, Patch } from '@nestjs/common';
import { Role } from './user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * DEVELOPMENT ONLY: Promote a user to ADMIN role
   */
  @Patch(':id/promote-admin')
  async promoteToAdmin(@Param('id') userId: string) {
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
