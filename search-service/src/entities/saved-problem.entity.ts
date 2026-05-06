import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('saved_problems')
export class SavedProblem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  problemId: number;

  @Column({ default: 'default' })
  collection: string;

  @CreateDateColumn()
  createdAt: Date;
}
