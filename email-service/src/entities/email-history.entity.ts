import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('email_history')
export class EmailHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  to: string;

  @Column()
  subject: string;

  @Column({ default: 'SENT' })
  status: string;

  @Column({ nullable: true })
  messageId: string;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  sentAt: Date;
}
