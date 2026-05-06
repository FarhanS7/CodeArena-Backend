import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  achievementType: string;

  @Column()
  title: string;

  @CreateDateColumn()
  earnedAt: Date;
}
