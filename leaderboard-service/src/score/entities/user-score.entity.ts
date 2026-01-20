import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('user_scores')
export class UserScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'user_id' })
  userId: string;

  @Column({ name: 'username', nullable: true })
  username: string;

  @Column({ default: 0 })
  score: number;

  @Column({ name: 'solved_count', default: 0 })
  solvedCount: number;

  @Column({ type: 'jsonb', name: 'solved_problem_ids', default: [] })
  solvedProblemIds: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
