import { Injectable } from "@nestjs/common";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async createUser(data) {
    return this.userRepository.createUser(data);
  }

  async updateRefreshToken(userId: string, hash: string | null) {
    await this.userRepository.update(userId, {
      refreshTokenHash: hash,
    });
  }

  async removeRefreshToken(userId: string) {
    await this.userRepository.update(userId, {
      refreshTokenHash: null,
    });
  }

  async findById(id: string) {
    return this.userRepository.findById(id);
  }

  async updateUser(user: any) {
    const updateData: any = {};

    if (user.role !== undefined) updateData.role = user.role;
    if (user.bio !== undefined) updateData.bio = user.bio;
    if (user.avatarUrl !== undefined) updateData.avatarUrl = user.avatarUrl;
    if (user.socialLinks !== undefined) updateData.socialLinks = user.socialLinks;
    if (user.username !== undefined) updateData.username = user.username;

    await this.userRepository.update(user.id, updateData);
    return this.userRepository.findById(user.id);
  }
}
