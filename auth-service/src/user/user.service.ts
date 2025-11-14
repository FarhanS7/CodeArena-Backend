import { Injectable } from "@nestjs/common";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async findByEmail(email: string) {
    return this.userRepo.findByEmail(email);
  }

  async createUser(data) {
    return this.userRepo.createUser(data);
  }
}
