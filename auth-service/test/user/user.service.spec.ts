import { Test } from "@nestjs/testing";
import { UserRepository } from "../../src/user/user.repository";
import { UserService } from "../../src/user/user.service";

describe("UserService", () => {
  let service: UserService;
  let repo: Partial<UserRepository>;

  beforeEach(async () => {
    repo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      createUser: jest
        .fn()
        .mockResolvedValue({ id: "1", email: "test@test.com" }),
    };

    const module = await Test.createTestingModule({
      providers: [UserService, { provide: UserRepository, useValue: repo }],
    }).compile();

    service = module.get(UserService);
  });

  it("should call repository.createUser", async () => {
    await service.createUser({ email: "test@test.com" });
    expect(repo.createUser).toHaveBeenCalled();
  });
});
