import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.token; // Fallback to HttpOnly cookie
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true, // Pass request to validate method
    });
  }

  /**
   * Validate JWT token with blacklist check (Issue #3)
   * This ensures logged-out tokens are rejected even if JWT signature is valid
   */
  async validate(req: Request, payload: JwtPayload) {
    // Extract token from request for blacklist check
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req) ||
      req?.cookies?.token;

    // Check if token is blacklisted (Issue #3 - revocation)
    if (token) {
      const isValid = await this.authService.isTokenValid(token);
      if (!isValid) {
        throw new UnauthorizedException("Token has been revoked");
      }
    }

    // Return user object that becomes req.user
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      jti: payload.jti, // Include jti for token tracking
      tokenVersion: payload.tokenVersion,
    };
  }
}
