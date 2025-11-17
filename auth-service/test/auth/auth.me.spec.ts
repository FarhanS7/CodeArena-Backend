import { JwtStrategy } from "../../src/auth/strategies/jwt.strategy";

describe("JwtStrategy", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret"; // FIX: mock secret key
  });

  it("returns user data in validate()", async () => {
    const strategy = new JwtStrategy();
    const payload = { sub: "1", email: "a@test.com", username: "john" };

    expect(await strategy.validate(payload)).toEqual({
      id: "1",
      email: "a@test.com",
      username: "john",
    });
  });
});
