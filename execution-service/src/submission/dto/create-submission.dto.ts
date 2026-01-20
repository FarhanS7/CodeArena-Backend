import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ProgrammingLanguage } from '../enums/submission.enum';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNumber()
  @IsNotEmpty()
  problemId: number;

  @IsEnum(ProgrammingLanguage)
  @IsNotEmpty()
  language: ProgrammingLanguage;

  @IsString()
  @IsNotEmpty()
  sourceCode: string;
}
