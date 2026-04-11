import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ContestService } from '../services/contest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CreateContestDto } from '../dto/create-contest.dto';
import { UpdateContestDto, UpdateContestStatusDto } from '../dto/update-contest.dto';
import {
  RegisterContestDto,
  SubmitToContestDto,
  ContestLeaderboardDto,
} from '../dto/participation.dto';
import { ContestResponseDto, ContestSummaryDto } from '../dto/contest-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { ContestStatus } from '../entities/contest.entity';

@ApiTags('contests')
@Controller('contests')
export class ContestController {
  constructor(private readonly contestService: ContestService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new contest (Admin only)' })
  @ApiResponse({ status: 201, description: 'Contest created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid contest data' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async create(
    @Body(ValidationPipe) createContestDto: CreateContestDto,
    @Request() req,
  ): Promise<ContestResponseDto> {
    const contest = await this.contestService.create(createContestDto, req.user.sub);
    return plainToClass(ContestResponseDto, contest, { excludeExtraneousValues: true });
  }

  @Get()
  @ApiOperation({ summary: 'Get contests list' })
  @ApiQuery({ name: 'status', required: false, enum: ContestStatus })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: 'Contests retrieved successfully' })
  async findAll(
    @Query('status') status?: ContestStatus,
    @Query('isPublic') isPublic?: boolean,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<{ contests: ContestSummaryDto[]; total: number }> {
    const { contests, total } = await this.contestService.findAll(status, isPublic, limit, offset);

    return {
      contests: contests.map(contest =>
        plainToClass(ContestSummaryDto, contest, { excludeExtraneousValues: true })
      ),
      total,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contest details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contest found' })
  @ApiResponse({ status: 404, description: 'Contest not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ContestResponseDto> {
    const contest = await this.contestService.findOne(id);
    return plainToClass(ContestResponseDto, contest, { excludeExtraneousValues: true });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contest details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contest updated successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Contest not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateContestDto: UpdateContestDto,
    @Request() req,
  ): Promise<ContestResponseDto> {
    const contest = await this.contestService.update(id, updateContestDto, req.user.sub);
    return plainToClass(ContestResponseDto, contest, { excludeExtraneousValues: true });
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contest status' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contest status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateStatusDto: UpdateContestStatusDto,
    @Request() req,
  ): Promise<ContestResponseDto> {
    const contest = await this.contestService.updateStatus(id, updateStatusDto, req.user.sub);
    return plainToClass(ContestResponseDto, contest, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete contest' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 204, description: 'Contest deleted successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Contest not found' })
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    await this.contestService.delete(id, req.user.sub);
  }

  // Participation endpoints
  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register for a contest' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Successfully registered for contest' })
  @ApiResponse({ status: 400, description: 'Registration not allowed' })
  @ApiResponse({ status: 409, description: 'Already registered' })
  async register(@Param('id', ParseIntPipe) contestId: number, @Request() req) {
    const participant = await this.contestService.registerParticipant(
      { contestId },
      req.user.sub,
    );
    return { message: 'Successfully registered for contest', participantId: participant.id };
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start contest participation' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contest participation started' })
  @ApiResponse({ status: 400, description: 'Cannot start participation' })
  async startParticipation(@Param('id', ParseIntPipe) contestId: number, @Request() req) {
    const participant = await this.contestService.startParticipation(contestId, req.user.sub);
    return { message: 'Contest participation started', participant };
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit solution during contest' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Solution submitted successfully' })
  @ApiResponse({ status: 400, description: 'Submission not allowed' })
  async submitSolution(
    @Param('id', ParseIntPipe) contestId: number,
    @Body(ValidationPipe) submitDto: Omit<SubmitToContestDto, 'contestId'>,
    @Request() req,
  ) {
    await this.contestService.submitSolution(
      { ...submitDto, contestId },
      req.user.sub,
    );
    return { message: 'Solution submitted successfully' };
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get contest leaderboard' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
  async getLeaderboard(
    @Param('id', ParseIntPipe) contestId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 100,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    return this.contestService.getContestLeaderboard(contestId, limit, offset);
  }

  @Get(':id/participation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user contest participation details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Participation details retrieved' })
  @ApiResponse({ status: 404, description: 'Not registered for this contest' })
  async getUserParticipation(@Param('id', ParseIntPipe) contestId: number, @Request() req) {
    const participation = await this.contestService.getUserParticipation(contestId, req.user.sub);

    if (!participation) {
      return { isRegistered: false, participation: null };
    }

    return { isRegistered: true, participation };
  }

  // Admin endpoints
  @Get(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contest participants (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Participants list retrieved' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getParticipants(@Param('id', ParseIntPipe) contestId: number) {
    return this.contestService.getContestLeaderboard(contestId, 1000, 0); // Get all participants
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contest analytics (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contest analytics retrieved' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getAnalytics(@Param('id', ParseIntPipe) contestId: number) {
    const contest = await this.contestService.findOne(contestId);
    const { participants, total } = await this.contestService.getContestLeaderboard(contestId, 1000, 0);

    const analytics = {
      contestId,
      title: contest.title,
      totalParticipants: total,
      totalProblems: contest.totalProblems,
      averageScore: participants.length > 0
        ? participants.reduce((sum, p) => sum + p.totalScore, 0) / participants.length
        : 0,
      averageProblemsolved: participants.length > 0
        ? participants.reduce((sum, p) => sum + p.problemsSolved, 0) / participants.length
        : 0,
      topScore: participants.length > 0 ? participants[0].totalScore : 0,
      finishRate: participants.filter(p => p.hasFinished).length / Math.max(total, 1),
      participationStats: {
        registered: participants.filter(p => p.status === 'REGISTERED').length,
        participating: participants.filter(p => p.status === 'PARTICIPATING').length,
        finished: participants.filter(p => p.status === 'FINISHED').length,
        disqualified: participants.filter(p => p.status === 'DISQUALIFIED').length,
      },
    };

    return analytics;
  }
}