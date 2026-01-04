import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ProgrammingLanguage } from '../enums/submission.enum';

export class CreateSubmissionDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

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
