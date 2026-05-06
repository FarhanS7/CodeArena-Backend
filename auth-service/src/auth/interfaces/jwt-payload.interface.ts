/**
 * JWT Payload Interface with security enhancements
 * Includes jti (JWT ID) for token tracking and revocation
 */
export interface JwtPayload {
  // Standard claims
  sub: string; // Subject (user ID)
  email: string;
  username: string;
  role: string;

  // Security claims for token tracking and revocation
  jti?: string; // JWT ID (unique identifier for this token instance)
  iat?: number; // Issued at (timestamp)
  exp?: number; // Expiration time (timestamp)

  // For refresh token validation
  tokenVersion?: number; // Token version for tracking refreshes
}

/**
 * Token response from authentication
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token payload with expiration info
 */
export interface TokenWithExpiry {
  token: string;
  expiresIn: number; // Expiration time in seconds
}
