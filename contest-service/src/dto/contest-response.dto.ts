import { Expose, Transform, Type } from 'class-transformer';
import { ContestStatus, ContestType } from '../entities/contest.entity';
import { ParticipantStatus } from '../entities/contest-participant.entity';

export class ContestProblemResponseDto {
  @Expose()
  id: number;

  @Expose()
  problemId: number;

  @Expose()
  points: number;

  @Expose()
  orderIndex: number;

  @Expose()
  label: string;

  @Expose()
  isActive: boolean;
}

export class ContestParticipantResponseDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  username: string; // From user service

  @Expose()
  status: ParticipantStatus;

  @Expose()
  totalScore: number;

  @Expose()
  problemsSolved: number;

  @Expose()
  totalSubmissions: number;

  @Expose()
  penaltyTime: number;

  @Expose()
  rank: number;

  @Expose()
  registeredAt: Date;

  @Expose()
  startedAt: Date;

  @Expose()
  finishedAt: Date;
}

export class ContestResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  rules: string;

  @Expose()
  prizes: string;

  @Expose()
  status: ContestStatus;

  @Expose()
  type: ContestType;

  @Expose()
  registrationStartTime: Date;

  @Expose()
  registrationEndTime: Date;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  durationInMinutes: number;

  @Expose()
  maxParticipants: number;

  @Expose()
  isPublic: boolean;

  @Expose()
  isRated: boolean;

  @Expose()
  @Type(() => ContestProblemResponseDto)
  contestProblems: ContestProblemResponseDto[];

  @Expose()
  @Transform(({ obj }) => obj.contestProblems?.length || 0)
  totalProblems: number;

  @Expose()
  @Transform(({ obj }) => obj.participants?.length || 0)
  totalParticipants: number;

  @Expose()
  @Transform(({ obj }) => {
    const now = new Date();
    return (
      now >= obj.registrationStartTime &&
      now <= obj.registrationEndTime &&
      obj.status !== ContestStatus.CANCELLED
    );
  })
  isRegistrationOpen: boolean;

  @Expose()
  @Transform(({ obj }) => {
    const now = new Date();
    return (
      now >= obj.startTime &&
      now <= obj.endTime &&
      obj.status === ContestStatus.ACTIVE
    );
  })
  isActive: boolean;

  @Expose()
  @Transform(({ obj }) => {
    const now = new Date();
    return now < obj.startTime && obj.status === ContestStatus.UPCOMING;
  })
  isUpcoming: boolean;

  @Expose()
  @Transform(({ obj }) => {
    const now = new Date();
    return now > obj.endTime || obj.status === ContestStatus.ENDED;
  })
  hasEnded: boolean;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.hasEnded || obj.isActive) return 0;
    return Math.max(0, new Date(obj.startTime).getTime() - Date.now());
  })
  timeUntilStart: number;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.hasEnded) return 0;
    if (!obj.isActive) return obj.durationInMinutes * 60 * 1000;
    return Math.max(0, new Date(obj.endTime).getTime() - Date.now());
  })
  timeUntilEnd: number;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}

export class ContestSummaryDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  status: ContestStatus;

  @Expose()
  type: ContestType;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  durationInMinutes: number;

  @Expose()
  @Transform(({ obj }) => obj.contestProblems?.length || 0)
  totalProblems: number;

  @Expose()
  @Transform(({ obj }) => obj.participants?.length || 0)
  totalParticipants: number;

  @Expose()
  @Transform(({ obj }) => {
    const now = new Date();
    return (
      now >= obj.registrationStartTime &&
      now <= obj.registrationEndTime &&
      obj.status !== ContestStatus.CANCELLED
    );
  })
  isRegistrationOpen: boolean;

  @Expose()
  isRated: boolean;

  @Expose()
  maxParticipants: number;
}