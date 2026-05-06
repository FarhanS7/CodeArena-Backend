import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('user_follows')
@Index(['followerId', 'followingId'], { unique: true })
export class UserFollow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  followerId: string;

  @Column()
  followingId: string;

  @CreateDateColumn()
  createdAt: Date;
}
