import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContestParticipant } from './contest-participant.entity';
import { ContestProblem } from './contest-problem.entity';

export enum ContestStatus {
  UPCOMING = 'UPCOMING',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum ContestType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITATION_ONLY = 'INVITATION_ONLY',
}

@Entity('contests')
export class Contest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  rules: string;

  @Column('text', { nullable: true })
  prizes: string;

  @Column({
    type: 'enum',
    enum: ContestStatus,
    default: ContestStatus.UPCOMING,
  })
  status: ContestStatus;

  @Column({
    type: 'enum',
    enum: ContestType,
    default: ContestType.PUBLIC,
  })
  type: ContestType;

  @Column('timestamp')
  registrationStartTime: Date;

  @Column('timestamp')
  registrationEndTime: Date;

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp')
  endTime: Date;

  @Column('int')
  durationInMinutes: number;

  @Column('int', { nullable: true })
  maxParticipants: number;

  @Column('int')
  createdBy: number; // Admin user ID

  @Column('boolean', { default: true })
  isPublic: boolean;

  @Column('boolean', { default: false })
  isRated: boolean; // Affects user ratings

  // Contest problems (many-to-many through ContestProblem)
  @OneToMany(() => ContestProblem, (contestProblem) => contestProblem.contest, {
    cascade: true,
  })
  contestProblems: ContestProblem[];

  // Contest participants
  @OneToMany(() => ContestParticipant, (participant) => participant.contest, {
    cascade: true,
  })
  participants: ContestParticipant[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual properties
  get totalProblems(): number {
    return this.contestProblems?.length || 0;
  }

  get totalParticipants(): number {
    return this.participants?.length || 0;
  }

  get isRegistrationOpen(): boolean {
    const now = new Date();
    return (
      now >= this.registrationStartTime &&
      now <= this.registrationEndTime &&
      this.status !== ContestStatus.CANCELLED
    );
  }

  get isActive(): boolean {
    const now = new Date();
    return (
      now >= this.startTime &&
      now <= this.endTime &&
      this.status === ContestStatus.ACTIVE
    );
  }

  get isUpcoming(): boolean {
    const now = new Date();
    return (
      now < this.startTime &&
      this.status === ContestStatus.UPCOMING
    );
  }

  get hasEnded(): boolean {
    const now = new Date();
    return (
      now > this.endTime ||
      this.status === ContestStatus.ENDED
    );
  }

  get timeUntilStart(): number {
    if (this.hasEnded || this.isActive) return 0;
    return Math.max(0, this.startTime.getTime() - new Date().getTime());
  }

  get timeUntilEnd(): number {
    if (this.hasEnded) return 0;
    if (!this.isActive) return this.durationInMinutes * 60 * 1000;
    return Math.max(0, this.endTime.getTime() - new Date().getTime());
  }

  get timeRemaining(): number {
    return this.timeUntilEnd;
  }
}