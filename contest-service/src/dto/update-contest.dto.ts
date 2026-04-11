import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateContestDto } from './create-contest.dto';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ContestStatus } from '../entities/contest.entity';

export class UpdateContestDto extends PartialType(
  OmitType(CreateContestDto, ['problems'] as const),
) {
  @IsEnum(ContestStatus)
  @IsOptional()
  status?: ContestStatus;
}

export class UpdateContestStatusDto {
  @IsEnum(ContestStatus)
  status: ContestStatus;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;
}