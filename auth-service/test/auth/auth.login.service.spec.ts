import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { AuthService } from "../../src/auth/auth.service";
import { UserService } from "../../src/user/user.service";

// --- 🔥 Fix: Mock bcrypt globally so compare() is fully replaceable ---
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed-refresh"),
  compare: jest.fn().mockResolvedValue(true),
}));

describe("AuthService (login)", () => {
  let authService: AuthService;

  const mockUserService = {
    findByEmail: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue("fake-jwt-token"),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it("throws if user is not found", async () => {
    mockUserService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login("missing@test.com", "password123")
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns token and user on valid credentials", async () => {
    const fakeUser = {
      id: "123",
      email: "test@example.com",
      username: "john",
      passwordHash: "hashed-password",
    };

    mockUserService.findByEmail.mockResolvedValue(fakeUser);

    // bcrypt.compare is now safely mockable
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.login("test@example.com", "password123");

    expect(result.accessToken).toBe("fake-jwt-token");
    expect(result.user).toEqual(fakeUser);

    expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      {
        sub: fakeUser.id,
        email: fakeUser.email,
        username: fakeUser.username,
      },
      { expiresIn: "15m" }
    );

    expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      { sub: fakeUser.id },
      { secret: undefined, expiresIn: "30d" }
    );
  });
});
