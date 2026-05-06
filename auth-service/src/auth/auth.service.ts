import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { User } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { TokenBlacklistService } from "./services/token-blacklist.service";
import { JwtPayload, TokenResponse } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = "15m";
  private readonly REFRESH_TOKEN_EXPIRY = "30d";
  private readonly REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklist: TokenBlacklistService
  ) {}

  async signup(email: string, username: string, password: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userService.createUser({
      email,
      username,
      passwordHash: hashedPassword,
      tokenVersion: 0, // Initialize token version
    });

    return { message: "User created successfully" };
  }

  /**
   * Generate access and refresh tokens with security enhancements
   * - jti claim for token tracking and revocation (Issue #3)
   * - tokenVersion for refresh token validation
   */
  async generateTokens(user: User): Promise<TokenResponse> {
    const jti = uuidv4(); // Unique ID for this token instance

    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      jti, // Include jti for token tracking
      tokenVersion: user.tokenVersion || 0,
    };

    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    // Refresh token also includes jti for tracking
    const refreshTokenPayload: JwtPayload = {
      sub: user.id,
      role: user.role,
      jti: uuidv4(), // Different jti for refresh token
      tokenVersion: user.tokenVersion || 0,
    };

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException("Invalid credentials");

    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Hash refresh token for rotation
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateRefreshToken(user.id, hashedRefresh);

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { accessToken, refreshToken, user: safeUser };
  }

  /**
   * Refresh access token with rotation (Issue #3)
   * - Increments tokenVersion to invalidate old refresh tokens
   * - Generates new pair of tokens
   * - Validates token against blacklist
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    if (!refreshToken) throw new UnauthorizedException("No refresh token");

    // Check if token is blacklisted (Issue #3)
    const isBlacklisted = await this.tokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException("Token has been revoked");
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (err) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) throw new UnauthorizedException("Invalid refresh token");

    // Validate token version matches (prevents replay of old tokens)
    if (payload.tokenVersion !== user.tokenVersion) {
      // Security event: old token used. Invalidate all user sessions.
      await this.userService.updateTokenVersion(user.id, (user.tokenVersion || 0) + 1);
      throw new UnauthorizedException("Token version mismatch - security alert - please login again");
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Hash and store the new refresh token
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userService.updateRefreshToken(user.id, hashedRefresh);

    // Increment token version for additional safety if needed, 
    // though generateTokens already uses the current version.
    // To truly rotate and invalidate the current one, we should increment.
    const newTokenVersion = (user.tokenVersion || 0) + 1;
    await this.userService.updateTokenVersion(user.id, newTokenVersion);

    return tokens;
  }

  /**
   * Logout and revoke tokens (Issue #3)
   * - Adds refresh token to blacklist
   * - Removes refresh token from database
   */
  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    if (!refreshToken) return;

    try {
      // Add refresh token to blacklist (Issue #3)
      await this.tokenBlacklist.addToBlacklist(refreshToken, this.REFRESH_TOKEN_EXPIRY_SECONDS);

      // Also blacklist access token if provided
      if (accessToken) {
        const accessTokenExpiry = 15 * 60; // 15 minutes
        await this.tokenBlacklist.addToBlacklist(accessToken, accessTokenExpiry);
      }

      // Remove from database
      const payload = this.jwtService.decode(refreshToken) as JwtPayload;
      if (payload?.sub) {
        await this.userService.removeRefreshToken(payload.sub);
      }
    } catch (err) {
      // Don't fail logout if blacklist operation fails
      console.error("Error during logout blacklist operation:", err);
    }
  }

  /**
   * Verify token hasn't been blacklisted (called by JWT strategy)
   * This ensures logged-out tokens are rejected even if JWT signature is valid
   */
  async isTokenValid(token: string): Promise<boolean> {
    return !(await this.tokenBlacklist.isBlacklisted(token));
  }
}
