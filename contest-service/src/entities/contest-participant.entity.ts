import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Contest } from './contest.entity';

export enum ParticipantStatus {
  REGISTERED = 'REGISTERED',
  PARTICIPATING = 'PARTICIPATING',
  FINISHED = 'FINISHED',
  DISQUALIFIED = 'DISQUALIFIED',
}

@Entity('contest_participants')
@Index(['contest', 'userId'], { unique: true }) // User can only join contest once
export class ContestParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  contestId: number;

  @Column('int')
  userId: number;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.REGISTERED,
  })
  status: ParticipantStatus;

  @Column('timestamp', { nullable: true })
  startedAt: Date; // When they started participating

  @Column('timestamp', { nullable: true })
  finishedAt: Date; // When they finished or left

  @Column('int', { default: 0 })
  totalScore: number;

  @Column('int', { default: 0 })
  problemsSolved: number;

  @Column('int', { default: 0 })
  totalSubmissions: number;

  @Column('int', { default: 0 })
  penaltyTime: number; // Total penalty in minutes

  @Column('int', { default: 0 })
  totalPenaltyMinutes: number; // ICPC-style penalty time (5 min per wrong attempt for solved problems)

  @Column('timestamp', { nullable: true })
  timeOfLastSolve: Date; // Time of last solved problem (for tiebreaking)

  @Column('int', { nullable: true })
  rank: number; // Final rank in contest

  @Column('boolean', { default: false })
  isOfficial: boolean; // Whether this participation counts for ratings

  // Additional participant data
  @Column('json', { nullable: true })
  problemScores: Record<string, {
    score: number;
    attempts: number;
    wrongSubmissions: number; // Count of wrong submissions before accepted
    solvedAt: Date | null;
    penaltyTime: number; // 5 minutes per wrong submission (ICPC style)
    submissionTime?: number; // Minutes from contest start when solved
  }>; // Problem-wise scoring details

  @Column('text', { nullable: true })
  notes: string; // Admin notes if any

  // Relationships
  @ManyToOne(() => Contest, (contest) => contest.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contestId' })
  contest: Contest;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === ParticipantStatus.PARTICIPATING;
  }

  get hasStarted(): boolean {
    return this.startedAt !== null;
  }

  get hasFinished(): boolean {
    return this.status === ParticipantStatus.FINISHED;
  }

  get isDisqualified(): boolean {
    return this.status === ParticipantStatus.DISQUALIFIED;
  }

  get participationDuration(): number | null {
    if (!this.startedAt) return null;
    const endTime = this.finishedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  // Helper methods
  updateProblemScoreICPC(
    problemId: string | number,
    score: number,
    isCorrect: boolean = false,
    submissionTime: Date = new Date(),
    contestStartTime?: Date,
  ): void {
    if (!this.problemScores) {
      this.problemScores = {};
    }

    const problemKey = problemId.toString();
    const currentScore = this.problemScores[problemKey] || {
      score: 0,
      attempts: 0,
      wrongSubmissions: 0,
      solvedAt: null,
      penaltyTime: 0,
      submissionTime: 0,
    };

    currentScore.attempts += 1;

    if (isCorrect && !currentScore.solvedAt) {
      // First correct solution - apply ICPC penalty
      currentScore.score = score;
      currentScore.solvedAt = submissionTime;
      currentScore.wrongSubmissions = currentScore.attempts - 1;
      currentScore.penaltyTime = currentScore.wrongSubmissions * 5; // 5 minutes per wrong attempt

      // Calculate submission time from contest start
      if (contestStartTime) {
        currentScore.submissionTime = Math.floor(
          (submissionTime.getTime() - contestStartTime.getTime()) / (1000 * 60),
        );
      }

      // Update total counters
      this.problemsSolved += 1;
      this.totalScore += score;
      this.timeOfLastSolve = submissionTime;

      // Update total penalty
      this.totalPenaltyMinutes += currentScore.penaltyTime;
    } else if (!isCorrect) {
      // Wrong submission - no penalty yet (only applied when accepted)
    }

    this.problemScores[problemKey] = currentScore;
    this.totalSubmissions += 1;
  }

  /**
   * Calculate ICPC-style score for a problem
   * Formula: problemPoints × (1 - (submissionTimeInMinutes / totalContestTimeInMinutes) × 0.25)
   * Then subtract 2 points per wrong submission (can't go below 0)
   */
  calculateProblemScoreICPC(
    basePoints: number,
    submissionTimeMinutes: number,
    totalContestTimeMinutes: number,
    wrongSubmissions: number,
  ): number {
    const timeFactorScore =
      basePoints * (1 - (submissionTimeMinutes / totalContestTimeMinutes) * 0.25);
    const penaltyScore = wrongSubmissions * 2; // 2 points penalty per wrong attempt
    return Math.max(0, timeFactorScore - penaltyScore);
  }

  getProblemScore(problemId: number): number {
    const problemKey = problemId.toString();
    return this.problemScores?.[problemKey]?.score || 0;
  }

  getProblemAttempts(problemId: number): number {
    const problemKey = problemId.toString();
    return this.problemScores?.[problemKey]?.attempts || 0;
  }

  hasSolvedProblem(problemId: number): boolean {
    const problemKey = problemId.toString();
    return this.problemScores?.[problemKey]?.solvedAt !== null;
  }
}