import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.email, dto.username, dto.password);
  }

  @Post("login")
  @Throttle({
    default: { limit: 5, ttl: 60 },
  })
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      body.email,
      body.password
    );

    // Access token
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // Refresh token
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user });
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Req() req) {
    return req.user; // from JwtStrategy.validate()
  }

  @Post("refresh")
  async refresh(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies.refresh_token;

    const accessToken = await this.authService.refreshAccessToken(refreshToken);

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({ message: "Token refreshed" });
  }

  @Post("logout")
  logout(@Res() res: Response) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return { message: "Logged out successfully" };
  }
}
