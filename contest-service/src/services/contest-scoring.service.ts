import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contest, ContestStatus } from '../entities/contest.entity';
import { ContestParticipant, ParticipantStatus } from '../entities/contest-participant.entity';
import { ContestProblem } from '../entities/contest-problem.entity';

interface ProblemDifficulty {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

interface ContestResult {
  contestId: number;
  finalResults: Array<{
    rank: number;
    userId: number;
    totalScore: number;
    totalPenaltyMinutes: number;
    problemsSolved: number;
    problemScores: Record<string, any>;
  }>;
  statistics: {
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    problemAcceptanceRates: Record<string, number>;
  };
}

@Injectable()
export class ContestScoringService {
  private readonly logger = new Logger(ContestScoringService.name);

  // Problem points based on difficulty
  private readonly PROBLEM_POINTS: ProblemDifficulty = {
    EASY: 100,
    MEDIUM: 150,
    HARD: 200,
  };

  // Penalty configuration
  private readonly PENALTY_PER_WRONG_SUBMISSION = 5; // minutes
  private readonly MAX_PENALTY_MINUTES = 500;
  private readonly SCORE_PENALTY_PER_WRONG = 2; // points deducted per wrong attempt

  constructor(
    @InjectRepository(Contest)
    private contestRepository: Repository<Contest>,
    @InjectRepository(ContestParticipant)
    private participantRepository: Repository<ContestParticipant>,
    @InjectRepository(ContestProblem)
    private contestProblemRepository: Repository<ContestProblem>,
  ) {}

  /**
   * Calculate penalty time in minutes
   * Formula: 5 minutes per wrong submission
   * Capped at 500 minutes maximum
   */
  calculatePenaltyMinutes(wrongSubmissions: number): number {
    const basePenalty = wrongSubmissions * this.PENALTY_PER_WRONG_SUBMISSION;
    return Math.min(basePenalty, this.MAX_PENALTY_MINUTES);
  }

  /**
   * Calculate score using ICPC formula
   * Formula: problemPoints × (1 - (timeTaken/totalContestTime) × 0.25) - (wrongSubmissions × 2)
   * Score cannot go below 0
   */
  calculateICPCScore(
    problemPoints: number,
    timeTakenMinutes: number,
    totalContestTimeMinutes: number,
    wrongSubmissions: number,
  ): number {
    // Time factor score: problemPoints × (1 - (timeTaken/totalContestTime) × 0.25)
    const timeFactorScore =
      problemPoints * (1 - (timeTakenMinutes / totalContestTimeMinutes) * 0.25);

    // Penalty score: -2 points per wrong submission
    const penaltyScore = wrongSubmissions * this.SCORE_PENALTY_PER_WRONG;

    // Final score cannot be negative
    return Math.max(0, timeFactorScore - penaltyScore);
  }

  /**
   * Get problem points based on difficulty
   */
  getProblemPoints(difficulty: string): number {
    const difficultyUpper = difficulty.toUpperCase();
    return this.PROBLEM_POINTS[difficultyUpper] || 100; // Default to 100 if unknown
  }

  /**
   * Rank participants using ICPC rules
   * Primary: Total score (descending)
   * Tiebreaker 1: Penalty time (ascending - less penalty is better)
   * Tiebreaker 2: Time of last solve (ascending - earlier is better)
   */
  rankParticipants(
    participants: ContestParticipant[],
  ): Array<{ participant: ContestParticipant; rank: number }> {
    // Filter out disqualified participants
    const validParticipants = participants.filter(
      (p) => p.status !== ParticipantStatus.DISQUALIFIED,
    );

    // Sort according to ICPC rules
    const sorted = [...validParticipants].sort((a, b) => {
      // Primary: Total score (descending - higher score is better)
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }

      // Tiebreaker 1: Penalty time (ascending - lower penalty is better)
      if (a.totalPenaltyMinutes !== b.totalPenaltyMinutes) {
        return a.totalPenaltyMinutes - b.totalPenaltyMinutes;
      }

      // Tiebreaker 2: Time of last solve (ascending - earlier submission is better)
      const timeA = a.timeOfLastSolve?.getTime() || Number.MAX_VALUE;
      const timeB = b.timeOfLastSolve?.getTime() || Number.MAX_VALUE;
      return timeA - timeB;
    });

    // Assign ranks
    return sorted.map((participant, index) => ({
      participant,
      rank: index + 1,
    }));
  }

  /**
   * Finalize contest results and calculate final rankings
   * Only allowed on ENDED contests
   */
  async finalizeContestResults(contestId: number): Promise<ContestResult> {
    this.logger.log(`Finalizing contest results for contest ${contestId}`);

    // Get contest
    const contest = await this.contestRepository.findOne({
      where: { id: contestId },
      relations: ['participants', 'contestProblems'],
    });

    if (!contest) {
      throw new BadRequestException(`Contest ${contestId} not found`);
    }

    // Verify contest has ended
    if (contest.status !== ContestStatus.ENDED) {
      throw new BadRequestException(
        `Contest must be ENDED to finalize results. Current status: ${contest.status}`,
      );
    }

    // Get contest problems
    const contestProblems = await this.contestProblemRepository.find({
      where: { contestId },
    });

    // Calculate total contest time in minutes
    const totalContestTimeMs = contest.endTime.getTime() - contest.startTime.getTime();
    const totalContestTimeMinutes = Math.floor(totalContestTimeMs / (1000 * 60));

    // Process each participant
    const participants = contest.participants || [];

    for (const participant of participants) {
      if (participant.status === ParticipantStatus.DISQUALIFIED) {
        continue; // Skip disqualified participants
      }

      // Recalculate scores based on ICPC formula
      let totalScore = 0;
      let totalPenalty = 0;

      if (participant.problemScores) {
        for (const [problemId, problemData] of Object.entries(
          participant.problemScores,
        )) {
          if (problemData.solvedAt) {
            // Calculate submission time from contest start
            const submissionTimeMs = (problemData.solvedAt as any).getTime()
              - contest.startTime.getTime();
            const submissionTimeMinutes = Math.floor(
              submissionTimeMs / (1000 * 60),
            );

            // Get problem points
            const problem = contestProblems.find(
              (p) => p.problemId.toString() === problemId,
            );
            const basePoints = problem
              ? this.getProblemPoints(problem.difficulty)
              : 100;

            // Calculate ICPC score
            const score = this.calculateICPCScore(
              basePoints,
              submissionTimeMinutes,
              totalContestTimeMinutes,
              problemData.wrongSubmissions,
            );

            // Calculate penalty
            const penalty = this.calculatePenaltyMinutes(
              problemData.wrongSubmissions,
            );

            totalScore += score;
            totalPenalty += penalty;

            // Update problem data
            problemData.score = score;
          }
        }
      }

      // Update participant with recalculated scores
      participant.totalScore = Math.round(totalScore);
      participant.totalPenaltyMinutes = totalPenalty;
      participant.status = ParticipantStatus.FINISHED;
    }

    // Rank participants
    const rankedParticipants = this.rankParticipants(participants);

    // Update ranks in database
    for (const { participant, rank } of rankedParticipants) {
      await this.participantRepository.update(participant.id, {
        rank,
        totalScore: participant.totalScore,
        totalPenaltyMinutes: participant.totalPenaltyMinutes,
        status: ParticipantStatus.FINISHED,
      });
    }

    // Calculate statistics
    const scores = participants
      .filter((p) => p.status !== ParticipantStatus.DISQUALIFIED)
      .map((p) => p.totalScore);

    const statistics = {
      totalParticipants: participants.length,
      averageScore: scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      problemAcceptanceRates: this.calculateAcceptanceRates(
        participants,
        contestProblems,
      ),
    };

    // Build results
    const finalResults = rankedParticipants.map(({ participant, rank }) => ({
      rank,
      userId: participant.userId,
      totalScore: participant.totalScore,
      totalPenaltyMinutes: participant.totalPenaltyMinutes,
      problemsSolved: participant.problemsSolved,
      problemScores: participant.problemScores || {},
    }));

    this.logger.log(`Contest ${contestId} finalized successfully. Rankings calculated.`);

    return {
      contestId,
      finalResults,
      statistics,
    };
  }

  /**
   * Calculate acceptance rate for each contest problem
   */
  private calculateAcceptanceRates(
    participants: ContestParticipant[],
    contestProblems: ContestProblem[],
  ): Record<string, number> {
    const acceptanceRates: Record<string, number> = {};

    for (const problem of contestProblems) {
      const problemLabel = problem.label || `P${problem.problemId}`;
      const totalAttempts = participants.filter((p) => {
        const problemData = p.problemScores?.[problem.problemId.toString()];
        return problemData && problemData.attempts > 0;
      }).length;

      const solvedCount = participants.filter((p) => {
        const problemData = p.problemScores?.[problem.problemId.toString()];
        return problemData && problemData.solvedAt;
      }).length;

      const rate = totalAttempts > 0
        ? Math.round((solvedCount / totalAttempts) * 100)
        : 0;

      acceptanceRates[problemLabel] = rate;
    }

    return acceptanceRates;
  }

  /**
   * Validate contest date ranges
   */
  validateContestDates(
    registrationStart: Date,
    registrationEnd: Date,
    contestStart: Date,
    contestEnd: Date,
    durationMinutes: number,
  ): boolean {
    // Registration start < registration end
    if (registrationStart >= registrationEnd) {
      throw new BadRequestException(
        'Registration start time must be before registration end time',
      );
    }

    // Registration end < contest start
    if (registrationEnd >= contestStart) {
      throw new BadRequestException(
        'Registration end time must be before contest start time',
      );
    }

    // Contest start < contest end
    if (contestStart >= contestEnd) {
      throw new BadRequestException(
        'Contest start time must be before contest end time',
      );
    }

    // Duration validation (5 minutes to 7 days)
    if (durationMinutes < 5 || durationMinutes > 7 * 24 * 60) {
      throw new BadRequestException(
        'Contest duration must be between 5 minutes and 7 days',
      );
    }

    return true;
  }

  /**
   * Auto-transition contest status based on current time
   * Called periodically to update contest statuses
   */
  async autoTransitionContestStatus(contestId: number): Promise<ContestStatus> {
    const contest = await this.contestRepository.findOne({
      where: { id: contestId },
    });

    if (!contest) {
      throw new BadRequestException(`Contest ${contestId} not found`);
    }

    const now = new Date();
    let newStatus = contest.status;

    // Transition logic
    if (
      contest.status === ContestStatus.UPCOMING &&
      now >= contest.registrationStartTime
    ) {
      newStatus = ContestStatus.REGISTRATION_OPEN;
    } else if (
      contest.status === ContestStatus.REGISTRATION_OPEN &&
      now >= contest.registrationEndTime
    ) {
      newStatus = ContestStatus.ACTIVE;
    } else if (
      contest.status === ContestStatus.ACTIVE &&
      now >= contest.endTime
    ) {
      newStatus = ContestStatus.ENDED;
      // Auto-finalize results when contest ends
      await this.finalizeContestResults(contestId);
    }

    // Update if status changed
    if (newStatus !== contest.status) {
      await this.contestRepository.update(contestId, { status: newStatus });
      this.logger.log(
        `Contest ${contestId} auto-transitioned from ${contest.status} to ${newStatus}`,
      );
    }

    return newStatus;
  }
}
