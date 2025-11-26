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
    await this.userRepository.update(user.id, { role: user.role });
    return this.userRepository.findById(user.id);
  }
}
