import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  type: string; // 'FOLLOW', 'CONTEST_INVITE', 'ACHIEVEMENT'

  @Column()
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column('jsonb', { nullable: true })
  data: any;

  @CreateDateColumn()
  createdAt: Date;
}
