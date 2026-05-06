import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('search_presets')
export class SearchPreset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column('jsonb')
  filters: any;

  @CreateDateColumn()
  createdAt: Date;
}
