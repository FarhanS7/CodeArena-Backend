import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    ValidationPipe
} from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Submission } from './entities/submission.entity';
import { SubmissionService } from './submission.service';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createSubmissionDto: CreateSubmissionDto,
  ): Promise<{
    success: boolean;
    data: Submission;
    message: string;
  }> {
    const submission = await this.submissionService.create(createSubmissionDto);
    return {
      success: true,
      data: submission,
      message: 'Submission created and queued for execution',
    };
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
  ): Promise<{
    success: boolean;
    data: Submission[];
  }> {
    const submissions = await this.submissionService.findAll(
      userId ? parseInt(userId) : undefined,
      problemId ? parseInt(problemId) : undefined,
    );
    return {
      success: true,
      data: submissions,
    };
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{
    success: boolean;
    data: Submission[];
  }> {
    const submissions = await this.submissionService.findByUser(userId);
    return {
      success: true,
      data: submissions,
    };
  }

  @Get('user/:userId/stats')
  async getUserStats(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{
    success: boolean;
    data: {
      totalSubmissions: number;
      acceptedSubmissions: number;
      acceptanceRate: number;
    };
  }> {
    const stats = await this.submissionService.getUserStats(userId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('problem/:problemId')
  async findByProblem(
    @Param('problemId', ParseIntPipe) problemId: number,
  ): Promise<{
    success: boolean;
    data: Submission[];
  }> {
    const submissions = await this.submissionService.findByProblem(problemId);
    return {
      success: true,
      data: submissions,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    success: boolean;
    data: Submission;
  }> {
    const submission = await this.submissionService.findOne(id);
    return {
      success: true,
      data: submission,
    };
  }
}
