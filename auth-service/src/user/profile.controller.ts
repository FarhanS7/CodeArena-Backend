import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@Req() req) {
    const userId = req.user.id ?? req.user.sub;
    const user = await this.userService.findById(userId);
    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  @Patch()
  async updateProfile(@Req() req, @Body() updateData: UpdateProfileDto) {
    const userId = req.user.id ?? req.user.sub;
    const updatedUser = await this.userService.updateUser({ id: userId, ...updateData });
    const { passwordHash, refreshTokenHash, ...result } = updatedUser;
    return result;
  }
}
