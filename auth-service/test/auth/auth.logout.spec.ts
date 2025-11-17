import { Test } from "@nestjs/testing";
import { Response } from "express";
import { AuthController } from "../../src/auth/auth.controller";
import { AuthService } from "../../src/auth/auth.service";

describe("AuthController (logout)", () => {
  let authController: AuthController;

  const mockAuthService = {}; // not used but required by Nest

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = moduleRef.get(AuthController);
  });

  it("clears cookies and returns success message", () => {
    const res: Partial<Response> = {
      clearCookie: jest.fn(),
      json: jest.fn().mockReturnValue({ message: "Logged out successfully" }),
    };

    const result = authController.logout(res as Response);

    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ message: "Logged out successfully" });
  });
});
