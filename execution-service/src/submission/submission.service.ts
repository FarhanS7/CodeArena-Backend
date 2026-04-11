import { InjectQueue } from '@nestjs/bull';
import {
    Inject,
    Injectable,
    Logger,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Queue } from 'bull';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Judge0Service } from '../judge0/judge0.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Submission } from './entities/submission.entity';
import { SubmissionStatus } from './enums/submission.enum';

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface Problem {
  id: number;
  title: string;
  difficulty: string;
  testCases: TestCase[];
}

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  private readonly problemServiceUrl: string;

  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    private judge0Service: Judge0Service,
    @InjectQueue('leaderboard-queue')
    private leaderboardQueue: Queue,
    @Inject('REDIS_PUBLISHER')
    private redisPublisher: Redis,
  ) {
    this.problemServiceUrl = process.env.PROBLEM_SERVICE_URL || 'http://localhost:8080';
  }

  private async publishStatusUpdate(submission: Submission) {
    const message = {
      submissionId: submission.id,
      userId: submission.userId,
      problemId: submission.problemId,
      status: submission.status,
      testCasesPassed: submission.testCasesPassed,
      totalTestCases: submission.totalTestCases,
      executionTime: submission.executionTime,
      memoryUsed: submission.memoryUsed,
      errorMessage: submission.errorMessage,
      testResults: submission.testResults,
      compilationError: submission.compilationError,
      runtimeError: submission.runtimeError,
      timestamp: new Date().toISOString(),
    };
    await this.redisPublisher.publish('submission-verdicts', JSON.stringify(message));
  }

  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    const submission = this.submissionRepository.create({
      ...createSubmissionDto,
      status: SubmissionStatus.PENDING,
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    // Publish initial status
    await this.publishStatusUpdate(savedSubmission);

    // Process submission asynchronously
    this.processSubmission(savedSubmission.id).catch((error) => {
      this.logger.error(`Error processing submission ${savedSubmission.id}:`, error);
    });

    return savedSubmission;
  }

  async findAll(userId?: string, problemId?: number, status?: SubmissionStatus): Promise<Submission[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (problemId) where.problemId = problemId;
    if (status) where.status = status;

    return this.submissionRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  async findByUser(userId: string): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByProblem(problemId: number): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { problemId },
      order: { createdAt: 'DESC' },
    });
  }

  private async processSubmission(submissionId: number): Promise<void> {
    this.logger.log(`Starting processing for submission: ${submissionId}`);
    try {
      // Update status to PROCESSING
      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.PROCESSING,
      });
      await this.publishStatusUpdate({ id: submissionId, status: SubmissionStatus.PROCESSING } as any);

      const submission = await this.findOne(submissionId);

      // Fetch problem and test cases from problem service
      const problem = await this.fetchProblem(submission.problemId);

      if (!problem.testCases || problem.testCases.length === 0) {
        await this.submissionRepository.update(submissionId, {
          status: SubmissionStatus.INTERNAL_ERROR,
          errorMessage: 'No test cases found for this problem',
        });
        return;
      }

      // Execute code against all test cases with detailed verdict tracking
      const executionResult = await this.judge0Service.batchExecute(
        submission.sourceCode,
        submission.language,
        problem.testCases,
      );

      // Calculate aggregate metrics
      const totalTime =
        executionResult.testResults.testCases.reduce((sum, tc) => sum + tc.time, 0) /
        executionResult.testResults.testCases.length;
      const maxMemory = Math.max(
        ...executionResult.testResults.testCases.map((tc) => tc.memory),
      );

      // Update submission with detailed results
      const updateData: Partial<Submission> = {
        status: executionResult.submissionStatus,
        testCasesPassed: executionResult.passed,
        totalTestCases: executionResult.total,
        executionTime: Math.round(totalTime),
        memoryUsed: maxMemory,
        testResults: executionResult.testResults,
        compilationError: executionResult.compilationError || undefined,
        runtimeError: executionResult.runtimeError || undefined,
        errorMessage: executionResult.compilationError || executionResult.runtimeError || undefined,
      };

      await this.submissionRepository.update(submissionId, updateData);

      // Fetch the updated submission to publish final result
      const updatedSubmission = await this.findOne(submissionId);
      await this.publishStatusUpdate(updatedSubmission);

      this.logger.log(
        `Submission ${submissionId} processed: ${executionResult.submissionStatus} (${executionResult.passed}/${executionResult.total})`,
      );

      // If accepted, emit event for leaderboard
      if (executionResult.submissionStatus === SubmissionStatus.ACCEPTED) {
        await this.leaderboardQueue.add('submission.accepted', {
          userId: submission.userId,
          username: submission.username,
          problemId: submission.problemId,
          difficulty: problem.difficulty,
          submissionId: submission.id,
        });
        this.logger.log(`Emitted submission.accepted event for submission ${submissionId}`);
      }
    } catch (error) {
      this.logger.error(`Error processing submission ${submissionId}:`, error);
      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.INTERNAL_ERROR,
        errorMessage: error.message,
      });
    }
  }

  private async fetchProblem(problemId: number): Promise<Problem> {
    this.logger.log(`Fetching problem data for ID: ${problemId} from ${this.problemServiceUrl}`);
    try {
      const response = await axios.get(
        `${this.problemServiceUrl}/problems/${problemId}`,
      );
      return response.data.data; // Assuming ApiResponse wrapper
    } catch (error) {
      this.logger.error(`Error fetching problem ${problemId}:`, error);
      throw new Error(`Failed to fetch problem: ${error.message}`);
    }
  }

  async getUserStats(userId: string): Promise<{
    totalSubmissions: number;
    acceptedSubmissions: number;
    acceptanceRate: number;
  }> {
    const submissions = await this.findByUser(userId);
    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(
      (s) => s.status === SubmissionStatus.ACCEPTED,
    ).length;

    return {
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate:
        totalSubmissions > 0
          ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
          : 0,
    };
  }
}
