import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { AuthService } from "../../src/auth/auth.service";
import { UserService } from "../../src/user/user.service";

describe("AuthService (signup)", () => {
  let authService: AuthService;

  const mockUserService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(), // not used in signup, but required by constructor
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

  it("throws if email already exists", async () => {
    mockUserService.findByEmail.mockResolvedValue({
      id: "1",
      email: "a@test.com",
    });

    await expect(
      authService.signup("a@test.com", "user1", "password123")
    ).rejects.toThrow("Email already exists");
  });

  it("creates a user if email is new", async () => {
    mockUserService.findByEmail.mockResolvedValue(null);
    mockUserService.createUser.mockResolvedValue({
      id: "2",
      email: "new@test.com",
      username: "newuser",
    });

    const result = await authService.signup(
      "new@test.com",
      "newuser",
      "password123"
    );

    expect(mockUserService.createUser).toHaveBeenCalled();
    expect(result).toEqual({ message: "User created successfully" });
  });
});
