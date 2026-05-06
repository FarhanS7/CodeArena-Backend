import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * TokenBlacklistService manages JWT token revocation
 * Tokens are added to blacklist on logout and checked on validation
 */
@Injectable()
export class TokenBlacklistService {
  constructor(private readonly redis: Redis) {}

  /**
   * Add a token to the blacklist (called on logout)
   * @param token JWT token to blacklist
   * @param expiresIn Token expiration time in seconds
   */
  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:${token}`;
    // Set with expiration equal to token expiration
    // Automatically removes from Redis when token expires
    await this.redis.setex(key, expiresIn, '1');
  }

  /**
   * Check if token is blacklisted
   * @param token JWT token to check
   * @returns true if token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * Remove token from blacklist (if needed)
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = `blacklist:${token}`;
    await this.redis.del(key);
  }

  /**
   * Clear all blacklisted tokens (admin operation)
   */
  async clearBlacklist(): Promise<void> {
    const keys = await this.redis.keys('blacklist:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Get count of blacklisted tokens
   */
  async getBlacklistCount(): Promise<number> {
    const keys = await this.redis.keys('blacklist:*');
    return keys.length;
  }
}
