import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ProgrammingLanguage, SubmissionStatus } from '../enums/submission.enum';

// Triggering sync after table drop
@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'username', nullable: true })
  username: string;

  @Column({ name: 'problem_id' })
  problemId: number;

  @Column({
    type: 'enum',
    enum: ProgrammingLanguage,
  })
  language: ProgrammingLanguage;

  @Column({ type: 'text', name: 'source_code' })
  sourceCode: string;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ name: 'execution_time', nullable: true })
  executionTime: number; // in milliseconds

  @Column({ name: 'memory_used', nullable: true })
  memoryUsed: number; // in KB

  @Column({ name: 'test_cases_passed', default: 0 })
  testCasesPassed: number;

  @Column({ name: 'total_test_cases', default: 0 })
  totalTestCases: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true, name: 'test_results' })
  testResults: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
