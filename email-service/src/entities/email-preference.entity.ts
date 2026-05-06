import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('email_preferences')
export class EmailPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ default: true })
  contestUpdates: boolean;

  @Column({ default: true })
  submissionUpdates: boolean;

  @Column({ default: true })
  discussionReplies: boolean;

  @Column({ default: false })
  upvoteNotifications: boolean;

  @Column({ default: true })
  leaderboardUpdates: boolean;

  @Column({ default: false })
  followerActivity: boolean;

  @Column({ default: 'WEEKLY' })
  emailFrequency: string;

  @Column({ default: 'MONDAY' })
  digestDay: string;

  @Column({ default: false })
  unsubscribedAll: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
