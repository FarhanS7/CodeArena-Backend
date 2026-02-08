import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { Judge0Service } from '../judge0/judge0.service';
import { Submission } from './entities/submission.entity';
import { SubmissionStatus } from './enums/submission.enum';
import { SubmissionService } from './submission.service';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let repository;
  let judge0Service;
  let queue;
  let redis;

  const mockSubmission = {
    id: 1,
    userId: '1',
    problemId: 1,
    language: 'python',
    sourceCode: 'print(1)',
    status: SubmissionStatus.PENDING,
    testCasesPassed: 0,
    totalTestCases: 0,
    executionTime: 0,
    memoryUsed: 0,
  };

  const mockProblem = {
    data: {
      data: {
        id: 1,
        title: 'Test Problem',
        difficulty: 'EASY',
        testCases: [{ input: '1', expectedOutput: '1' }],
      },
    },
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn().mockReturnValue({ ...mockSubmission }),
      save: jest.fn().mockResolvedValue({ ...mockSubmission }),
      findOne: jest.fn().mockResolvedValue({ ...mockSubmission }),
      update: jest.fn().mockResolvedValue({}),
      find: jest.fn(),
    };

    judge0Service = {
      batchExecute: jest.fn(),
    };

    queue = {
      add: jest.fn(),
    };

    redis = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: getRepositoryToken(Submission),
          useValue: repository,
        },
        {
          provide: Judge0Service,
          useValue: judge0Service,
        },
        {
          provide: getQueueToken('leaderboard-queue'),
          useValue: queue,
        },
        {
          provide: 'REDIS_PUBLISHER',
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process submission successfully (ACCEPTED)', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue(mockProblem);
    judge0Service.batchExecute.mockResolvedValue({
      passed: 1,
      total: 1,
      results: [
        {
          passed: true,
          input: '1',
          expectedOutput: '1',
          actualOutput: '1',
          time: 0.1,
          memory: 1024,
        },
      ],
    });

    await (service as any).processSubmission(1);

    expect(repository.update).toHaveBeenCalledWith(1, expect.objectContaining({
      status: SubmissionStatus.ACCEPTED,
    }));
    expect(queue.add).toHaveBeenCalled();
  });

  it('should handle runtime error (RUNTIME_ERROR)', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue(mockProblem);
    judge0Service.batchExecute.mockResolvedValue({
      passed: 0,
      total: 1,
      results: [
        {
          passed: false,
          input: '1',
          expectedOutput: '1',
          actualOutput: '',
          time: 0,
          memory: 0,
          error: 'TypeError: can only concatenate str (not "int") to str',
        },
      ],
    });

    await (service as any).processSubmission(1);

    expect(repository.update).toHaveBeenCalledWith(1, expect.objectContaining({
      status: SubmissionStatus.RUNTIME_ERROR,
    }));
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('should handle internal errors gracefully', async () => {
    jest.spyOn(axios, 'get').mockRejectedValue(new Error('Service down'));
    // judge0Service not called

    await (service as any).processSubmission(1);

    expect(repository.update).toHaveBeenCalledWith(1, expect.objectContaining({
      status: SubmissionStatus.INTERNAL_ERROR,
    }));
  });
});
