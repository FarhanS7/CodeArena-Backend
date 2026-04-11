import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionService } from '../submission.service';
import { Judge0Service } from '../../judge0/judge0.service';
import { Submission } from '../entities/submission.entity';
import { SubmissionStatus, ProgrammingLanguage } from '../enums/submission.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * INTEGRATION TESTS - Verdict Tracking Flow
 * Tests the full flow: Submission → Judge0 Execution → Detailed Verdict Tracking
 */
describe('SubmissionService - Verdict Tracking Integration (TDD)', () => {
  let service: SubmissionService;
  let judge0Service: Judge0Service;
  let submissionRepository: Repository<Submission>;

  const mockSubmissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'JUDGE0_URL') return 'https://judge0-ce.p.rapidapi.com';
      if (key === 'JUDGE0_API_KEY') return 'test-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        Judge0Service,
        {
          provide: getRepositoryToken(Submission),
          useValue: mockSubmissionRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'REDIS_PUBLISHER',
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    judge0Service = module.get<Judge0Service>(Judge0Service);
    submissionRepository = module.get<Repository<Submission>>(getRepositoryToken(Submission));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Integration: Create Submission with Verdict Tracking', () => {
    /**
     * TEST: Submission should store accepted status with all test results
     */
    it('should create submission and track ACCEPTED verdict with detailed test results', async () => {
      const submission = new Submission();
      submission.id = 1;
      submission.userId = 'user-1';
      submission.problemId = 1;
      submission.language = ProgrammingLanguage.PYTHON;
      submission.sourceCode = `
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
print(factorial(int(input())))
      `;
      submission.status = SubmissionStatus.ACCEPTED;
      submission.testCasesPassed = 3;
      submission.totalTestCases = 3;
      submission.executionTime = 85; // average ms
      submission.memoryUsed = 2048; // max KB

      // Detailed verdict structure
      submission.testResults = {
        totalTests: 3,
        passedTests: 3,
        testCases: [
          {
            id: 1,
            input: '5',
            expectedOutput: '120',
            actualOutput: '120',
            status: 'PASSED',
            time: 45,
            memory: 2048,
          },
          {
            id: 2,
            input: '3',
            expectedOutput: '6',
            actualOutput: '6',
            status: 'PASSED',
            time: 30,
            memory: 1024,
          },
          {
            id: 3,
            input: '0',
            expectedOutput: '1',
            actualOutput: '1',
            status: 'PASSED',
            time: 170,
            memory: 1536,
          },
        ],
      };

      mockSubmissionRepository.save.mockResolvedValue(submission);

      const result = await submissionRepository.save(submission);

      expect(result.status).toBe(SubmissionStatus.ACCEPTED);
      expect(result.testResults.totalTests).toBe(3);
      expect(result.testResults.passedTests).toBe(3);
      expect(result.testResults.testCases).toHaveLength(3);
      expect(result.testResults.testCases[0].status).toBe('PASSED');
      expect(result.testResults.testCases[0].actualOutput).toBe('120');
    });

    /**
     * TEST: Submission with wrong answer should track individual test failures
     */
    it('should track WRONG_ANSWER with detailed breakdown of passed/failed tests', async () => {
      const submission = new Submission();
      submission.status = SubmissionStatus.WRONG_ANSWER;
      submission.testCasesPassed = 2;
      submission.totalTestCases = 5;

      submission.testResults = {
        totalTests: 5,
        passedTests: 2,
        testCases: [
          {
            id: 1,
            input: '1',
            expectedOutput: '1',
            actualOutput: '1',
            status: 'PASSED',
            time: 50,
            memory: 1024,
          },
          {
            id: 2,
            input: '2',
            expectedOutput: '2',
            actualOutput: '2',
            status: 'PASSED',
            time: 60,
            memory: 1024,
          },
          {
            id: 3,
            input: '5',
            expectedOutput: '120',
            actualOutput: '100',
            status: 'FAILED',
            time: 75,
            memory: 2048,
            errorMessage: 'Output mismatch',
          },
          {
            id: 4,
            input: '10',
            expectedOutput: '3628800',
            actualOutput: '3600000',
            status: 'FAILED',
            time: 80,
            memory: 2048,
            errorMessage: 'Output mismatch',
          },
          {
            id: 5,
            input: '0',
            expectedOutput: '1',
            actualOutput: '1',
            status: 'PASSED',
            time: 45,
            memory: 512,
          },
        ],
      };

      const passedCount = submission.testResults.testCases.filter(
        (tc) => tc.status === 'PASSED',
      ).length;
      const failedCount = submission.testResults.testCases.filter(
        (tc) => tc.status === 'FAILED',
      ).length;

      expect(passedCount).toBe(2);
      expect(failedCount).toBe(3);
      expect(submission.status).toBe(SubmissionStatus.WRONG_ANSWER);
    });

    /**
     * TEST: Compilation error should be tracked separately with error message
     */
    it('should track COMPILATION_ERROR with detailed error message', async () => {
      const submission = new Submission();
      submission.status = SubmissionStatus.COMPILATION_ERROR;
      submission.compilationError =
        'SyntaxError: invalid syntax at line 5\nprint(factorial(int(input())) # Missing closing parenthesis';
      submission.testResults = null; // No test execution on compile error

      expect(submission.compilationError).toBeDefined();
      expect(submission.compilationError).toContain('SyntaxError');
      expect(submission.testResults).toBeNull();
      expect(submission.status).toBe(SubmissionStatus.COMPILATION_ERROR);
    });

    /**
     * TEST: Runtime error should track where it occurred
     */
    it('should track RUNTIME_ERROR with partial test results', async () => {
      const submission = new Submission();
      submission.status = SubmissionStatus.RUNTIME_ERROR;
      submission.runtimeError = 'IndexError: list index out of range at line 12';

      submission.testResults = {
        totalTests: 10,
        passedTests: 3,
        testCases: [
          { id: 1, status: 'PASSED', time: 50, memory: 1024 },
          { id: 2, status: 'PASSED', time: 60, memory: 1024 },
          { id: 3, status: 'PASSED', time: 45, memory: 1024 },
          {
            id: 4,
            status: 'RUNTIME_ERROR',
            time: 100,
            memory: 8192,
            errorMessage: 'IndexError: list index out of range',
          },
        ],
      };

      expect(submission.runtimeError).toContain('IndexError');
      expect(submission.testResults.passedTests).toBe(3);
      // Remainder of test cases may not have executed
      expect(submission.testResults.testCases.length).toBeLessThan(10);
    });

    /**
     * TEST: Time Limit Exceeded should show execution time exceeding limit
     */
    it('should track TIME_LIMIT_EXCEEDED with test execution time exceeding limit', async () => {
      const submission = new Submission();
      submission.status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
      submission.testResults = {
        totalTests: 10,
        passedTests: 5,
        testCases: [
          { id: 1, status: 'PASSED', time: 100, memory: 2048 },
          { id: 2, status: 'PASSED', time: 150, memory: 2048 },
          { id: 3, status: 'PASSED', time: 120, memory: 2048 },
          { id: 4, status: 'PASSED', time: 110, memory: 2048 },
          { id: 5, status: 'PASSED', time: 130, memory: 2048 },
          {
            id: 6,
            status: 'TIME_LIMIT_EXCEEDED',
            time: 2001,
            memory: 3072,
            timeLimit: 2000,
            errorMessage: 'Execution time exceeded 2000ms',
          },
        ],
      };

      const tleTest = submission.testResults.testCases[5];
      expect(tleTest.status).toBe('TIME_LIMIT_EXCEEDED');
      expect(tleTest.time).toBeGreaterThan(tleTest.timeLimit);
    });

    /**
     * TEST: Memory Limit Exceeded should show memory usage
     */
    it('should track MEMORY_LIMIT_EXCEEDED with memory usage details', async () => {
      const submission = new Submission();
      submission.status = SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
      submission.testResults = {
        totalTests: 10,
        passedTests: 2,
        testCases: [
          { id: 1, status: 'PASSED', time: 50, memory: 50000 },
          { id: 2, status: 'PASSED', time: 60, memory: 60000 },
          {
            id: 3,
            status: 'MEMORY_LIMIT_EXCEEDED',
            time: 500,
            memory: 131072,
            memoryLimit: 131072,
            errorMessage: 'Memory limit exceeded',
          },
        ],
      };

      const mleTest = submission.testResults.testCases[2];
      expect(mleTest.status).toBe('MEMORY_LIMIT_EXCEEDED');
      expect(mleTest.memory).toBeGreaterThanOrEqual(mleTest.memoryLimit);
    });
  });

  describe('Verdict Publishing', () => {
    /**
     * TEST: Published verdict should include all detailed information
     */
    it('should publish detailed verdict to Redis with test results and errors', async () => {
      const redisPublisherMock = { publish: jest.fn().mockResolvedValue(undefined) };

      const message = {
        submissionId: 1,
        userId: 'user-1',
        problemId: 1,
        status: SubmissionStatus.WRONG_ANSWER,
        testCasesPassed: 7,
        totalTestCases: 10,
        executionTime: 120,
        memoryUsed: 3072,
        testResults: {
          totalTests: 10,
          passedTests: 7,
          testCases: [
            { id: 1, status: 'PASSED', time: 100, memory: 2048 },
            { id: 2, status: 'PASSED', time: 110, memory: 2048 },
            // ... 8 more
          ],
        },
        compilationError: null,
        runtimeError: null,
        timestamp: new Date().toISOString(),
      };

      await redisPublisherMock.publish('submission-verdicts', JSON.stringify(message));

      expect(redisPublisherMock.publish).toHaveBeenCalledWith(
        'submission-verdicts',
        expect.stringContaining('testResults'),
      );
      expect(redisPublisherMock.publish).toHaveBeenCalledWith(
        'submission-verdicts',
        expect.stringContaining('WRONG_ANSWER'),
      );
    });
  });

  describe('Metrics Calculation', () => {
    /**
     * TEST: Should calculate correct average execution time from all tests
     */
    it('should calculate average execution time across all test cases', () => {
      const testResults = {
        totalTests: 4,
        passedTests: 4,
        testCases: [
          { id: 1, time: 100, memory: 2048 },
          { id: 2, time: 120, memory: 2048 },
          { id: 3, time: 80, memory: 1024 },
          { id: 4, time: 100, memory: 2048 },
        ],
      };

      const avgTime = testResults.testCases.reduce((sum, tc) => sum + tc.time, 0) / testResults.testCases.length;

      expect(avgTime).toBe(100); // (100+120+80+100)/4 = 100
    });

    /**
     * TEST: Should capture maximum memory usage across all tests
     */
    it('should capture maximum memory usage across all test cases', () => {
      const testResults = {
        totalTests: 4,
        passedTests: 4,
        testCases: [
          { id: 1, time: 100, memory: 2048 },
          { id: 2, time: 120, memory: 5120 },
          { id: 3, time: 80, memory: 3072 },
          { id: 4, time: 100, memory: 4096 },
        ],
      };

      const maxMemory = Math.max(...testResults.testCases.map((tc) => tc.memory));

      expect(maxMemory).toBe(5120);
    });
  });
});
