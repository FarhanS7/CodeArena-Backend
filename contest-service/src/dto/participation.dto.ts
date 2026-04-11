import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { ParticipantStatus } from '../entities/contest-participant.entity';

export class RegisterContestDto {
  @IsInt()
  contestId: number;

  @IsOptional()
  userId?: number; // Will be set from JWT token
}

export class UpdateParticipantDto {
  @IsEnum(ParticipantStatus)
  @IsOptional()
  status?: ParticipantStatus;

  @IsInt()
  @IsOptional()
  totalScore?: number;

  @IsInt()
  @IsOptional()
  problemsSolved?: number;
}

export class ContestLeaderboardDto {
  @IsInt()
  contestId: number;

  @IsInt()
  @IsOptional()
  limit?: number = 100;

  @IsInt()
  @IsOptional()
  offset?: number = 0;
}

export class SubmitToContestDto {
  @IsInt()
  contestId: number;

  @IsInt()
  problemId: number;

  @IsInt()
  submissionId: number; // Reference to the submission in execution service

  @IsInt()
  @IsOptional()
  points?: number;

  @IsOptional()
  userId?: number; // Will be set from JWT token
}