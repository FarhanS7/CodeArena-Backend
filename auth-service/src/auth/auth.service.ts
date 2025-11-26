import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../user/user.entity";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  // --------------------------
  // SIGNUP
  // --------------------------
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
    });

    return { message: "User created successfully" };
  }

  // --------------------------
  // TOKEN GENERATOR
  // --------------------------
  async generateTokens(user: User) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      { expiresIn: "15m" }
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "30d",
      }
    );

    return { accessToken, refreshToken };
  }

  // --------------------------
  // LOGIN
  // --------------------------
  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException("Invalid credentials");

    // Generate both tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Hash refresh token for rotation
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateRefreshToken(user.id, hashedRefresh);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  // --------------------------
  // REFRESH ACCESS TOKEN
  // --------------------------
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException("No refresh token");

    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (err) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.refreshTokenHash)
      throw new UnauthorizedException("Invalid refresh token");

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) throw new UnauthorizedException("Invalid refresh token");

    // New access token (rotation)
    return await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      { expiresIn: "15m" }
    );
  }

  // --------------------------
  // LOGOUT — just remove refresh token
  // --------------------------
  async logout(refreshToken: string) {
    if (!refreshToken) return;

    const payload = this.jwtService.decode(refreshToken) as any;
    if (payload?.sub) {
      await this.userService.removeRefreshToken(payload.sub);
    }
  }
}
