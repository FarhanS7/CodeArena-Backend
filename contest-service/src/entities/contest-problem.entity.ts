import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Contest } from './contest.entity';

@Entity('contest_problems')
@Index(['contest', 'problemId'], { unique: true }) // Prevent duplicate problems in same contest
export class ContestProblem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  contestId: number;

  @Column('int')
  problemId: number; // Reference to problem in problem-service

  @Column('int')
  points: number; // Points for solving this problem

  @Column('int')
  orderIndex: number; // Display order in contest (0-based)

  @Column('varchar', { length: 1, default: 'A' })
  label: string; // Problem label in contest (A, B, C, etc.)

  @Column('boolean', { default: true })
  isActive: boolean; // Can be disabled during contest

  // Relationships
  @ManyToOne(() => Contest, (contest) => contest.contestProblems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contestId' })
  contest: Contest;

  @CreateDateColumn()
  created_at: Date;

  // Helper methods
  static generateLabel(orderIndex: number): string {
    return String.fromCharCode(65 + orderIndex); // A, B, C, etc.
  }

  get displayName(): string {
    return `${this.label}. Problem ${this.problemId}`;
  }
}