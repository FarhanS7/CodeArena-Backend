import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('search_history')
export class SearchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  query: string;

  @Column({ default: 1 })
  count: number;

  @CreateDateColumn()
  timestamp: Date;
}
