import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Contest, ContestStatus } from '../entities/contest.entity';
import { ContestParticipant, ParticipantStatus } from '../entities/contest-participant.entity';
import { ContestProblem } from '../entities/contest-problem.entity';
import { CreateContestDto } from '../dto/create-contest.dto';
import { UpdateContestDto, UpdateContestStatusDto } from '../dto/update-contest.dto';
import { RegisterContestDto, SubmitToContestDto } from '../dto/participation.dto';

@Injectable()
export class ContestService {
  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,

    @InjectRepository(ContestParticipant)
    private readonly participantRepository: Repository<ContestParticipant>,

    @InjectRepository(ContestProblem)
    private readonly contestProblemRepository: Repository<ContestProblem>,
  ) {}

  // Contest CRUD operations
  async create(createContestDto: CreateContestDto, createdBy: number): Promise<Contest> {
    const {
      problems,
      registrationStartTime,
      registrationEndTime,
      startTime,
      durationInMinutes,
      ...contestData
    } = createContestDto;

    // Validate dates
    this.validateContestDates(
      new Date(registrationStartTime),
      new Date(registrationEndTime),
      new Date(startTime),
      durationInMinutes,
    );

    // Calculate end time
    const endTime = new Date(new Date(startTime).getTime() + durationInMinutes * 60 * 1000);

    // Create contest
    const contest = this.contestRepository.create({
      ...contestData,
      registrationStartTime: new Date(registrationStartTime),
      registrationEndTime: new Date(registrationEndTime),
      startTime: new Date(startTime),
      endTime,
      durationInMinutes,
      createdBy,
    });

    const savedContest = await this.contestRepository.save(contest);

    // Add problems to contest
    const contestProblems = problems.map((problem, index) => {
      return this.contestProblemRepository.create({
        contestId: savedContest.id,
        problemId: problem.problemId,
        points: problem.points,
        orderIndex: problem.orderIndex ?? index,
        label: problem.label ?? ContestProblem.generateLabel(problem.orderIndex ?? index),
      });
    });

    await this.contestProblemRepository.save(contestProblems);

    return this.findOne(savedContest.id);
  }

  async findAll(
    status?: ContestStatus,
    isPublic?: boolean,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ contests: Contest[]; total: number }> {
    const where: FindOptionsWhere<Contest> = {};

    if (status) where.status = status;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const [contests, total] = await this.contestRepository.findAndCount({
      where,
      relations: ['contestProblems', 'participants'],
      order: { startTime: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { contests, total };
  }

  async findOne(id: number): Promise<Contest> {
    const contest = await this.contestRepository.findOne({
      where: { id },
      relations: ['contestProblems', 'participants'],
      order: {
        contestProblems: { orderIndex: 'ASC' },
        participants: { totalScore: 'DESC', penaltyTime: 'ASC' },
      },
    });

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${id} not found`);
    }

    return contest;
  }

  async update(id: number, updateContestDto: UpdateContestDto, userId: number): Promise<Contest> {
    const contest = await this.findOne(id);

    // Check if user has permission to update (creator or admin)
    if (contest.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to update this contest');
    }

    // Don't allow updates if contest has already started
    if (contest.isActive || contest.hasEnded) {
      throw new BadRequestException('Cannot update contest that has already started or ended');
    }

    // Validate new dates if provided
    if (updateContestDto.registrationStartTime || updateContestDto.startTime || updateContestDto.durationInMinutes) {
      const regStart = updateContestDto.registrationStartTime
        ? new Date(updateContestDto.registrationStartTime)
        : contest.registrationStartTime;
      const regEnd = updateContestDto.registrationEndTime
        ? new Date(updateContestDto.registrationEndTime)
        : contest.registrationEndTime;
      const start = updateContestDto.startTime
        ? new Date(updateContestDto.startTime)
        : contest.startTime;
      const duration = updateContestDto.durationInMinutes ?? contest.durationInMinutes;

      this.validateContestDates(regStart, regEnd, start, duration);

      // Update end time if necessary
      if (updateContestDto.startTime || updateContestDto.durationInMinutes) {
        updateContestDto['endTime'] = new Date(start.getTime() + duration * 60 * 1000);
      }
    }

    await this.contestRepository.update(id, updateContestDto);
    return this.findOne(id);
  }

  async updateStatus(id: number, updateStatusDto: UpdateContestStatusDto, userId: number): Promise<Contest> {
    const contest = await this.findOne(id);

    // Check permissions
    if (contest.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to update this contest');
    }

    // Validate status transition
    this.validateStatusTransition(contest.status, updateStatusDto.status);

    // Update times if provided
    const updateData: any = { status: updateStatusDto.status };
    if (updateStatusDto.startTime) {
      updateData.startTime = new Date(updateStatusDto.startTime);
      updateData.endTime = new Date(
        new Date(updateStatusDto.startTime).getTime() + contest.durationInMinutes * 60 * 1000
      );
    }
    if (updateStatusDto.endTime) {
      updateData.endTime = new Date(updateStatusDto.endTime);
    }

    await this.contestRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: number, userId: number): Promise<void> {
    const contest = await this.findOne(id);

    // Check permissions
    if (contest.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to delete this contest');
    }

    // Don't allow deletion if contest has participants and has started
    if (contest.participants.length > 0 && contest.isActive) {
      throw new BadRequestException('Cannot delete active contest with participants');
    }

    await this.contestRepository.delete(id);
  }

  // Participation methods
  async registerParticipant(registerDto: RegisterContestDto, userId: number): Promise<ContestParticipant> {
    const contest = await this.findOne(registerDto.contestId);

    // Validate registration eligibility
    this.validateRegistrationEligibility(contest, userId);

    // Check if already registered
    const existingParticipant = await this.participantRepository.findOne({
      where: { contestId: registerDto.contestId, userId },
    });

    if (existingParticipant) {
      throw new ConflictException('You are already registered for this contest');
    }

    // Check max participants limit
    if (contest.maxParticipants && contest.participants.length >= contest.maxParticipants) {
      throw new BadRequestException('Contest has reached maximum participants limit');
    }

    const participant = this.participantRepository.create({
      contestId: registerDto.contestId,
      userId,
      status: ParticipantStatus.REGISTERED,
      isOfficial: contest.isRated, // Official participation for rated contests
    });

    return this.participantRepository.save(participant);
  }

  async startParticipation(contestId: number, userId: number): Promise<ContestParticipant> {
    const contest = await this.findOne(contestId);
    const participant = await this.findParticipant(contestId, userId);

    if (!contest.isActive) {
      throw new BadRequestException('Contest is not currently active');
    }

    if (participant.status !== ParticipantStatus.REGISTERED) {
      throw new BadRequestException('Invalid participation status');
    }

    // Start participation
    await this.participantRepository.update(participant.id, {
      status: ParticipantStatus.PARTICIPATING,
      startedAt: new Date(),
    });

    return this.findParticipant(contestId, userId);
  }

  async submitSolution(submitDto: SubmitToContestDto, userId: number): Promise<void> {
    const contest = await this.findOne(submitDto.contestId);
    const participant = await this.findParticipant(submitDto.contestId, userId);

    if (!contest.isActive) {
      throw new BadRequestException('Contest is not active');
    }

    if (participant.status !== ParticipantStatus.PARTICIPATING) {
      throw new BadRequestException('You are not actively participating in this contest');
    }

    // Find the contest problem
    const contestProblem = contest.contestProblems.find(cp => cp.problemId === submitDto.problemId);
    if (!contestProblem) {
      throw new BadRequestException('Problem is not part of this contest');
    }

    // Update participant's problem score
    // Note: This would need integration with execution service to get actual results
    const isCorrect = submitDto.points > 0; // Simplified logic
    participant.updateProblemScore(
      submitDto.problemId,
      submitDto.points || 0,
      isCorrect,
      new Date(),
    );

    await this.participantRepository.save(participant);
  }

  async getContestLeaderboard(
    contestId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ participants: ContestParticipant[]; total: number }> {
    const [participants, total] = await this.participantRepository.findAndCount({
      where: { contestId },
      order: {
        totalScore: 'DESC',
        penaltyTime: 'ASC',
        problemsSolved: 'DESC',
        updated_at: 'ASC', // Earlier completion time as tiebreaker
      },
      take: limit,
      skip: offset,
    });

    // Update ranks
    participants.forEach((participant, index) => {
      participant.rank = offset + index + 1;
    });

    return { participants, total };
  }

  async getUserParticipation(contestId: number, userId: number): Promise<ContestParticipant | null> {
    return this.participantRepository.findOne({
      where: { contestId, userId },
      relations: ['contest'],
    });
  }

  // Helper methods
  private async findParticipant(contestId: number, userId: number): Promise<ContestParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { contestId, userId },
    });

    if (!participant) {
      throw new NotFoundException('You are not registered for this contest');
    }

    return participant;
  }

  private validateContestDates(
    regStart: Date,
    regEnd: Date,
    contestStart: Date,
    durationInMinutes: number,
  ): void {
    const now = new Date();
    const contestEnd = new Date(contestStart.getTime() + durationInMinutes * 60 * 1000);

    if (regStart <= now) {
      throw new BadRequestException('Registration start time must be in the future');
    }

    if (regEnd <= regStart) {
      throw new BadRequestException('Registration end time must be after start time');
    }

    if (contestStart <= regEnd) {
      throw new BadRequestException('Contest start time must be after registration end time');
    }

    if (contestEnd <= contestStart) {
      throw new BadRequestException('Contest end time must be after start time');
    }

    if (durationInMinutes < 5) {
      throw new BadRequestException('Contest duration must be at least 5 minutes');
    }

    if (durationInMinutes > 60 * 24 * 7) {
      throw new BadRequestException('Contest duration cannot exceed 1 week');
    }
  }

  private validateRegistrationEligibility(contest: Contest, userId: number): void {
    if (!contest.isRegistrationOpen) {
      throw new BadRequestException('Registration is not open for this contest');
    }

    if (contest.status === ContestStatus.CANCELLED) {
      throw new BadRequestException('Contest has been cancelled');
    }

    if (contest.hasEnded) {
      throw new BadRequestException('Contest has already ended');
    }

    if (!contest.isPublic) {
      throw new ForbiddenException('This is a private contest');
    }
  }

  private validateStatusTransition(currentStatus: ContestStatus, newStatus: ContestStatus): void {
    const validTransitions: Record<ContestStatus, ContestStatus[]> = {
      [ContestStatus.UPCOMING]: [ContestStatus.REGISTRATION_OPEN, ContestStatus.ACTIVE, ContestStatus.CANCELLED],
      [ContestStatus.REGISTRATION_OPEN]: [ContestStatus.ACTIVE, ContestStatus.CANCELLED],
      [ContestStatus.ACTIVE]: [ContestStatus.ENDED, ContestStatus.CANCELLED],
      [ContestStatus.ENDED]: [], // No transitions from ended
      [ContestStatus.CANCELLED]: [], // No transitions from cancelled
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}