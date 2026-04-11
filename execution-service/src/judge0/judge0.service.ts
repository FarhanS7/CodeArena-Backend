import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ProgrammingLanguage, SubmissionStatus } from '../submission/enums/submission.enum';

interface Judge0Response {
  stdout: string;
  stderr: string;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
  compile_output?: string;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  time: number; // milliseconds
  memory: number; // KB
  status: string;
  compilationError?: string;
  runtimeError?: string;
  statusId?: number; // Judge0 status ID for detailed handling
}

interface TestCaseResult {
  id: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: 'PASSED' | 'FAILED' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR';
  time: number; // milliseconds
  memory: number; // KB
  errorMessage?: string;
  timeLimit?: number;
  memoryLimit?: number;
}

@Injectable()
export class Judge0Service {
  private readonly logger = new Logger(Judge0Service.name);
  private readonly judge0Url: string;
  private readonly judge0ApiKey: string;

  // Judge0 Status Codes
  private readonly STATUS_CODES = {
    ACCEPTED: 3,
    WRONG_ANSWER: 4,
    TIME_LIMIT_EXCEEDED: 5,
    COMPILATION_ERROR: 6,
    RUNTIME_ERROR: 7, // (NZEC)
    INTERNAL_ERROR: 8,
    EXEC_FORMAT_ERROR: 9,
    MEMORY: 11,
    SEGMENTATION_FAULT: 12,
  };

  // Language ID mapping for Judge0 API
  private readonly languageMap = {
    [ProgrammingLanguage.JAVASCRIPT]: 63, // Node.js
    [ProgrammingLanguage.PYTHON]: 71, // Python 3
    [ProgrammingLanguage.JAVA]: 62, // Java
    [ProgrammingLanguage.CPP]: 54, // C++ (GCC 9.2.0)
    [ProgrammingLanguage.C]: 50, // C (GCC 9.2.0)
    [ProgrammingLanguage.TYPESCRIPT]: 74, // TypeScript
  };

  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(private configService: ConfigService) {
    this.judge0Url = this.configService.get<string>('JUDGE0_URL') || 'https://judge0-ce.p.rapidapi.com';
    this.judge0ApiKey = this.configService.get<string>('JUDGE0_API_KEY') || '';
  }

  /**
   * Execute code with retry logic and detailed error handling
   * @returns ExecutionResult with detailed error information
   */
  async executeCodeWithRetry(
    sourceCode: string,
    language: ProgrammingLanguage,
    stdin: string,
    timeLimit: number = 2, // seconds
    memoryLimit: number = 128000, // KB
  ): Promise<ExecutionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(`Execution attempt ${attempt}/${this.MAX_RETRIES} for ${language}`);
        return await this.executeCode(sourceCode, language, stdin, timeLimit, memoryLimit);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt}/${this.MAX_RETRIES} failed: ${error.message}. Retrying in ${this.RETRY_DELAY_MS}ms...`,
        );

        // Don't retry on compilation errors or validation errors
        if (error.message?.includes('Unsupported language') || error.message?.includes('Invalid code')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // All retries failed
    this.logger.error(`All ${this.MAX_RETRIES} execution attempts failed`, lastError?.stack);
    return {
      success: false,
      stdout: '',
      stderr: lastError?.message || 'All execution attempts failed after retries',
      time: 0,
      memory: 0,
      status: 'INTERNAL_ERROR',
    };
  }

  /**
   * Execute single test case code
   */
  private async executeCode(
    sourceCode: string,
    language: ProgrammingLanguage,
    stdin: string,
    timeLimit: number = 2,
    memoryLimit: number = 128000,
  ): Promise<ExecutionResult> {
    const languageId = this.languageMap[language];

    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.judge0Url.includes('rapidapi.com')) {
      headers['X-RapidAPI-Key'] = this.judge0ApiKey;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    try {
      const response = await axios.post(
        `${this.judge0Url}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: sourceCode,
          language_id: languageId,
          stdin: stdin,
          cpu_time_limit: timeLimit,
          memory_limit: memoryLimit,
        },
        {
          headers,
          timeout: 30000, // 30 second timeout
        },
      );

      const result: Judge0Response = response.data;
      return this.parseJudge0Response(result);
    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  /**
   * Parse Judge0 response and extract detailed information
   */
  private parseJudge0Response(result: Judge0Response): ExecutionResult {
    const statusId = result.status?.id;
    const statusDescription = result.status?.description || 'Unknown';

    // Extract error information
    let compilationError: string | undefined;
    let runtimeError: string | undefined;
    let success = false;

    if (statusId === this.STATUS_CODES.ACCEPTED) {
      success = true;
    } else if (statusId === this.STATUS_CODES.COMPILATION_ERROR) {
      compilationError = result.compile_output || result.stderr || 'Compilation failed';
    } else if (
      statusId === this.STATUS_CODES.RUNTIME_ERROR ||
      statusId === this.STATUS_CODES.SEGMENTATION_FAULT
    ) {
      runtimeError = result.stderr || `Runtime error (status: ${statusDescription})`;
    }

    return {
      success,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      time: result.time ? parseFloat(result.time) * 1000 : 0, // Convert to ms
      memory: result.memory || 0,
      status: statusDescription,
      compilationError,
      runtimeError,
      statusId,
    };
  }

  /**
   * Handle execution errors with detailed classification
   */
  private handleExecutionError(error: any): ExecutionResult {
    this.logger.error(`Judge0 execution error: ${error.message}`, error.stack);

    let status = 'INTERNAL_ERROR';
    let errorMessage = error.message;

    if (error.code === 'ECONNREFUSED') {
      status = 'SERVICE_UNAVAILABLE';
      errorMessage = 'Judge0 service unavailable. Please try again.';
    } else if (error.code === 'ETIMEDOUT') {
      status = 'TIME_LIMIT_EXCEEDED';
      errorMessage = 'Execution timed out';
    } else if (error.response?.status === 429) {
      status = 'RATE_LIMIT';
      errorMessage = 'Rate limited by Judge0. Please try again later.';
    } else if (error.response?.status === 401) {
      status = 'INVALID_API_KEY';
      errorMessage = 'Invalid Judge0 API key';
    }

    return {
      success: false,
      stdout: '',
      stderr: errorMessage,
      time: 0,
      memory: 0,
      status,
    };
  }

  /**
   * Execute multiple test cases and collect detailed results
   * @returns Structured test results for storage
   */
  async batchExecute(
    sourceCode: string,
    language: ProgrammingLanguage,
    testCases: Array<{ input: string; expectedOutput: string }>,
    timeLimit: number = 2,
    memoryLimit: number = 128000,
  ): Promise<{
    passed: number;
    total: number;
    testResults: {
      totalTests: number;
      passedTests: number;
      testCases: TestCaseResult[];
    };
    submissionStatus: SubmissionStatus;
    compilationError?: string;
    runtimeError?: string;
  }> {
    const testResults: TestCaseResult[] = [];
    let passedCount = 0;
    let compilationError: string | undefined;
    let runtimeError: string | undefined;
    let firstRuntimeError = false;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await this.executeCodeWithRetry(
        sourceCode,
        language,
        testCase.input,
        timeLimit,
        memoryLimit,
      );

      // Check for compilation error on first test
      if (i === 0 && result.compilationError) {
        compilationError = result.compilationError;
        // Store compilation error but continue to track all tests
      }

      // Determine test case status
      let testStatus: TestCaseResult['status'] = 'FAILED';
      if (result.compilationError) {
        testStatus = 'COMPILATION_ERROR';
      } else if (result.status === 'Time Limit Exceeded') {
        testStatus = 'TIME_LIMIT_EXCEEDED';
      } else if (result.status === 'Memory Limit Exceeded') {
        testStatus = 'MEMORY_LIMIT_EXCEEDED';
      } else if (result.runtimeError || result.status.includes('Runtime')) {
        testStatus = 'RUNTIME_ERROR';
        if (!firstRuntimeError) {
          runtimeError = result.runtimeError;
          firstRuntimeError = true;
        }
      } else if (result.success && result.stdout.trim() === testCase.expectedOutput.trim()) {
        testStatus = 'PASSED';
        passedCount++;
      }

      testResults.push({
        id: i + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.stdout.trim(),
        status: testStatus,
        time: result.time,
        memory: result.memory,
        errorMessage: result.stderr || result.runtimeError,
        timeLimit: timeLimit * 1000, // Convert to ms
        memoryLimit: memoryLimit,
      });

      this.logger.debug(`Test ${i + 1}/${testCases.length}: ${testStatus}`);
    }

    // Determine overall submission status
    let submissionStatus: SubmissionStatus;
    if (compilationError) {
      submissionStatus = SubmissionStatus.COMPILATION_ERROR;
    } else if (runtimeError && passedCount < testCases.length) {
      submissionStatus = SubmissionStatus.RUNTIME_ERROR;
    } else if (testResults.some(tc => tc.status === 'TIME_LIMIT_EXCEEDED')) {
      submissionStatus = SubmissionStatus.TIME_LIMIT_EXCEEDED;
    } else if (testResults.some(tc => tc.status === 'MEMORY_LIMIT_EXCEEDED')) {
      submissionStatus = SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
    } else if (passedCount === testCases.length) {
      submissionStatus = SubmissionStatus.ACCEPTED;
    } else {
      submissionStatus = SubmissionStatus.WRONG_ANSWER;
    }

    return {
      passed: passedCount,
      total: testCases.length,
      testResults: {
        totalTests: testCases.length,
        passedTests: passedCount,
        testCases: testResults,
      },
      submissionStatus,
      compilationError,
      runtimeError,
    };
  }

  /**
   * Utility: delay function for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
