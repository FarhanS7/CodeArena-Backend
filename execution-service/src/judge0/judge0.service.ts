import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProgrammingLanguage } from '../submission/enums/submission.enum';

interface Judge0Response {
  stdout: string;
  stderr: string;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
}

@Injectable()
export class Judge0Service {
  private readonly logger = new Logger(Judge0Service.name);
  private readonly judge0Url: string;
  private readonly judge0ApiKey: string;

  // Language ID mapping for Judge0 API
  private readonly languageMap = {
    [ProgrammingLanguage.JAVASCRIPT]: 63, // Node.js
    [ProgrammingLanguage.PYTHON]: 71, // Python 3
    [ProgrammingLanguage.JAVA]: 62, // Java
    [ProgrammingLanguage.CPP]: 54, // C++ (GCC 9.2.0)
    [ProgrammingLanguage.C]: 50, // C (GCC 9.2.0)
    [ProgrammingLanguage.TYPESCRIPT]: 74, // TypeScript
  };

  constructor(private configService: ConfigService) {
    this.judge0Url = this.configService.get<string>('JUDGE0_URL') || 'https://judge0-ce.p.rapidapi.com';
    this.judge0ApiKey = this.configService.get<string>('JUDGE0_API_KEY') || '';
  }

  async executeCode(
    sourceCode: string,
    language: ProgrammingLanguage,
    stdin: string,
    timeLimit: number = 2, // seconds
    memoryLimit: number = 128000, // KB
  ): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    time: number;
    memory: number;
    status: string;
  }> {
    try {
      const languageId = this.languageMap[language];

      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Create submission
      const submissionResponse = await axios.post(
        `${this.judge0Url}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: sourceCode,
          language_id: languageId,
          stdin: stdin,
          cpu_time_limit: timeLimit,
          memory_limit: memoryLimit,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.judge0ApiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
        },
      );

      const result: Judge0Response = submissionResponse.data;

      return {
        success: result.status.id === 3, // Status 3 = Accepted
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        time: parseFloat(result.time) * 1000 || 0, // Convert to ms
        memory: result.memory || 0,
        status: result.status.description,
      };
    } catch (error) {
      this.logger.error(`Judge0 execution error: ${error.message}`, error.stack);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        time: 0,
        memory: 0,
        status: 'INTERNAL_ERROR',
      };
    }
  }

  async batchExecute(
    sourceCode: string,
    language: ProgrammingLanguage,
    testCases: Array<{ input: string; expectedOutput: string }>,
  ): Promise<{
    passed: number;
    total: number;
    results: Array<{
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      time: number;
      memory: number;
      error?: string;
    }>;
  }> {
    const results: Array<{
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      time: number;
      memory: number;
      error?: string;
    }> = [];
    let passed = 0;

    for (const testCase of testCases) {
      const result = await this.executeCode(
        sourceCode,
        language,
        testCase.input,
      );

      const testPassed = result.success && result.stdout.trim() === testCase.expectedOutput.trim();

      if (testPassed) {
        passed++;
      }

      results.push({
        passed: testPassed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.stdout.trim(),
        time: result.time,
        memory: result.memory,
        error: result.stderr ? result.stderr : undefined,
      });
    }

    return {
      passed,
      total: testCases.length,
      results,
    };
  }
}
