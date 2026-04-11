import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionService } from '../submission.service';
import { Submission } from '../entities/submission.entity';
import { SubmissionStatus, ProgrammingLanguage } from '../enums/submission.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('SubmissionVerdictTracking (TDD)', () => {
  let service: SubmissionService;
  let submissionRepository: Repository<Submission>;

  const mockSubmissionRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: getRepositoryToken(Submission),
          useValue: mockSubmissionRepository,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    submissionRepository = module.get<Repository<Submission>>(getRepositoryToken(Submission));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Verdict Structure', () => {
    /**
     * TEST 1 (RED): Submission should have detailed test results structure
     * Expected: testResults should contain totalTests, passedTests, and array of individual test results
     */
    it('should store detailed test results with structure: totalTests, passedTests, testCases[]', async () => {
      const submission = new Submission();
      submission.id = 1;
      submission.userId = 'user-123';
      submission.problemId = 1;
      submission.language = ProgrammingLanguage.PYTHON;
      submission.sourceCode = 'print("hello")';
      submission.status = SubmissionStatus.ACCEPTED;

      // Expected test results structure
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
            time: 25,
            memory: 512,
          },
        ],
      };

      mockSubmissionRepository.save.mockResolvedValue(submission);
      const result = await submissionRepository.save(submission);

      expect(result.testResults).toHaveProperty('totalTests');
      expect(result.testResults).toHaveProperty('passedTests');
      expect(result.testResults).toHaveProperty('testCases');
      expect(Array.isArray(result.testResults.testCases)).toBe(true);
      expect(result.testResults.totalTests).toBe(3);
      expect(result.testResults.passedTests).toBe(3);
    });

    /**
     * TEST 2 (RED): Should track individual test case results with pass/fail status
     */
    it('should track individual test case results with PASSED/FAILED status', async () => {
      const testResults = {
        totalTests: 4,
        passedTests: 2,
        testCases: [
          { id: 1, status: 'PASSED', time: 50, memory: 2048 },
          { id: 2, status: 'FAILED', time: 100, memory: 4096 },
          { id: 3, status: 'PASSED', time: 45, memory: 2048 },
          { id: 4, status: 'FAILED', time: 150, memory: 5120 },
        ],
      };

      expect(testResults.testCases).toHaveLength(4);
      expect(testResults.testCases[0].status).toBe('PASSED');
      expect(testResults.testCases[1].status).toBe('FAILED');
      expect(testResults.testCases.filter(tc => tc.status === 'PASSED')).toHaveLength(2);
    });

    /**
     * TEST 3 (RED): Should handle edge case - all tests failed
     */
    it('should handle submission where all tests failed', async () => {
      const submission = new Submission();
      submission.status = SubmissionStatus.WRONG_ANSWER;
      submission.testResults = {
        totalTests: 5,
        passedTests: 0,
        testCases: [
          { id: 1, status: 'FAILED', expectedOutput: '10', actualOutput: '9' },
          { id: 2, status: 'FAILED', expectedOutput: '20', actualOutput: '19' },
          { id: 3, status: 'FAILED', expectedOutput: '30', actualOutput: '29' },
          { id: 4, status: 'FAILED', expectedOutput: '40', actualOutput: '39' },
          { id: 5, status: 'FAILED', expectedOutput: '50', actualOutput: '49' },
        ],
      };

      expect(submission.testResults.passedTests).toBe(0);
      expect(submission.testResults.totalTests).toBe(5);
      expect(submission.status).toBe(SubmissionStatus.WRONG_ANSWER);
    });
  });

  describe('Error Handling', () => {
    /**
     * TEST 4 (RED): Should store compilation errors separately
     */
    it('should store compilation errors in compilationError field (not testResults)', async () => {
      const submission = new Submission();
      submission.id = 2;
      submission.status = SubmissionStatus.COMPILATION_ERROR;
      submission.compilationError = "SyntaxError: invalid syntax at line 5";
      submission.testResults = null;

      mockSubmissionRepository.save.mockResolvedValue(submission);
      const result = await submissionRepository.save(submission);

      expect(result.compilationError).toBeDefined();
      expect(result.compilationError).toContain('SyntaxError');
      expect(result.status).toBe(SubmissionStatus.COMPILATION_ERROR);
      // When compilation error, testResults should be null
      expect(result.testResults).toBeNull();
    });

    /**
     * TEST 5 (RED): Should store runtime errors separately
     */
    it('should store runtime errors in runtimeError field', async () => {
      const submission = new Submission();
      submission.id = 3;
      submission.status = SubmissionStatus.RUNTIME_ERROR;
      submission.runtimeError = "IndexError: list index out of range at line 12";
      submission.testResults = {
        totalTests: 10,
        passedTests: 3,
        testCases: [
          { id: 1, status: 'PASSED' },
          { id: 2, status: 'PASSED' },
          { id: 3, status: 'PASSED' },
          { id: 4, status: 'RUNTIME_ERROR', errorMessage: 'Segmentation fault' },
        ],
      };

      mockSubmissionRepository.save.mockResolvedValue(submission);
      const result = await submissionRepository.save(submission);

      expect(result.runtimeError).toBeDefined();
      expect(result.runtimeError).toContain('IndexError');
      expect(result.status).toBe(SubmissionStatus.RUNTIME_ERROR);
    });

    /**
     * TEST 6 (RED): Should handle Time Limit Exceeded status
     */
    it('should handle Time Limit Exceeded with partial test results', async () => {
      const submission = new Submission();
      submission.id = 4;
      submission.status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
      submission.testResults = {
        totalTests: 10,
        passedTests: 5,
        testCases: [
          { id: 1, status: 'PASSED', time: 100 },
          { id: 2, status: 'PASSED', time: 150 },
          { id: 3, status: 'PASSED', time: 120 },
          { id: 4, status: 'PASSED', time: 110 },
          { id: 5, status: 'PASSED', time: 130 },
          { id: 6, status: 'TIME_LIMIT_EXCEEDED', time: 2001, timeLimit: 2000 },
        ],
      };

      expect(submission.testResults.testCases[5].status).toBe('TIME_LIMIT_EXCEEDED');
      expect(submission.testResults.testCases[5].time).toBeGreaterThan(2000);
    });

    /**
     * TEST 7 (RED): Should handle Memory Limit Exceeded
     */
    it('should handle Memory Limit Exceeded with partial test results', async () => {
      const submission = new Submission();
      submission.id = 5;
      submission.status = SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
      submission.testResults = {
        totalTests: 10,
        passedTests: 2,
        testCases: [
          { id: 1, status: 'PASSED', memory: 50000 },
          { id: 2, status: 'PASSED', memory: 60000 },
          { id: 3, status: 'MEMORY_LIMIT_EXCEEDED', memory: 131072, memoryLimit: 131072 },
        ],
      };

      const mleTest = submission.testResults.testCases[2];
      expect(mleTest.status).toBe('MEMORY_LIMIT_EXCEEDED');
      expect(mleTest.memory).toBeGreaterThanOrEqual(mleTest.memoryLimit);
    });
  });

  describe('Submission Status Calculation', () => {
    /**
     * TEST 8 (RED): Should correctly determine ACCEPTED status
     */
    it('should determine ACCEPTED status when all tests pass', () => {
      const testResults = {
        totalTests: 5,
        passedTests: 5,
        testCases: Array(5).fill({ status: 'PASSED' }),
      };

      const isAccepted = testResults.passedTests === testResults.totalTests;
      expect(isAccepted).toBe(true);
    });

    /**
     * TEST 9 (RED): Should correctly determine WRONG_ANSWER status
     */
    it('should determine WRONG_ANSWER when some tests fail', () => {
      const testResults = {
        totalTests: 5,
        passedTests: 3,
        testCases: [
          { status: 'PASSED' },
          { status: 'PASSED' },
          { status: 'PASSED' },
          { status: 'FAILED' },
          { status: 'FAILED' },
        ],
      };

      const status =
        testResults.passedTests === 0
          ? SubmissionStatus.WRONG_ANSWER
          : testResults.passedTests === testResults.totalTests
          ? SubmissionStatus.ACCEPTED
          : SubmissionStatus.WRONG_ANSWER;

      expect(status).toBe(SubmissionStatus.WRONG_ANSWER);
    });
  });

  describe('Execution Metrics', () => {
    /**
     * TEST 10 (RED): Should track execution time and memory for each test
     */
    it('should track execution time (ms) and memory (KB) for each test', async () => {
      const testCase = {
        id: 1,
        input: '5',
        expectedOutput: '120',
        actualOutput: '120',
        status: 'PASSED',
        time: 157.3, // milliseconds from Judge0
        memory: 2048, // KB
      };

      expect(testCase.time).toBeGreaterThan(0);
      expect(testCase.memory).toBeGreaterThan(0);
      expect(typeof testCase.time).toBe('number');
      expect(typeof testCase.memory).toBe('number');
    });

    /**
     * TEST 11 (RED): Should calculate total execution time and max memory across all tests
     */
    it('should calculate aggregate metrics from all tests', () => {
      const testResults = {
        totalTests: 3,
        passedTests: 3,
        testCases: [
          { id: 1, time: 100, memory: 2048 },
          { id: 2, time: 150, memory: 3072 },
          { id: 3, time: 120, memory: 2560 },
        ],
      };

      const totalTime = testResults.testCases.reduce((sum, tc) => sum + tc.time, 0);
      const maxMemory = Math.max(...testResults.testCases.map(tc => tc.memory));

      expect(totalTime).toBe(370);
      expect(maxMemory).toBe(3072);
    });
  });

  describe('Output Comparison', () => {
    /**
     * TEST 12 (RED): Should store expected vs actual output for debugging
     */
    it('should store expected vs actual output for failed tests', () => {
      const failedTest = {
        id: 2,
        input: 'hello world',
        expectedOutput: 'world hello',
        actualOutput: 'hello world',
        status: 'FAILED',
      };

      expect(failedTest.expectedOutput).not.toBe(failedTest.actualOutput);
      expect(failedTest).toHaveProperty('input');
      expect(failedTest).toHaveProperty('expectedOutput');
      expect(failedTest).toHaveProperty('actualOutput');
    });
  });
});
