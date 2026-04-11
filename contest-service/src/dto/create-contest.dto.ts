import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContestType } from '../entities/contest.entity';

export class ContestProblemDto {
  @IsInt()
  @Min(1)
  problemId: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  points: number;

  @IsInt()
  @Min(0)
  orderIndex: number;

  @IsString()
  @Length(1, 2)
  @IsOptional()
  label?: string;
}

export class CreateContestDto {
  @IsString()
  @Length(3, 200)
  title: string;

  @IsString()
  @Length(10, 5000)
  description: string;

  @IsString()
  @IsOptional()
  @Length(0, 2000)
  rules?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  prizes?: string;

  @IsEnum(ContestType)
  @IsOptional()
  type?: ContestType = ContestType.PUBLIC;

  @IsDateString()
  registrationStartTime: string;

  @IsDateString()
  registrationEndTime: string;

  @IsDateString()
  startTime: string;

  @IsInt()
  @Min(5) // Minimum 5 minutes
  @Max(60 * 24 * 7) // Maximum 1 week
  durationInMinutes: number;

  @IsInt()
  @Min(1)
  @Max(10000)
  @IsOptional()
  maxParticipants?: number;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isRated?: boolean = false;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContestProblemDto)
  @ArrayMinSize(1, { message: 'Contest must have at least one problem' })
  problems: ContestProblemDto[];

  // Transform to ensure end time is calculated from start time and duration
  @Transform(({ obj }) => {
    const start = new Date(obj.startTime);
    const duration = obj.durationInMinutes;
    return new Date(start.getTime() + duration * 60 * 1000).toISOString();
  })
  endTime?: string;
}