import { User } from 'src/user/entities/user.entity';
import { MediaType } from 'src/post/entities/post.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mediaUrl: string;

  @Column({ type: 'enum', enum: MediaType, default: MediaType.IMAGE })
  mediaType: MediaType;

  @Column({ nullable: true })
  caption: string;

  @ManyToOne(() => User, (user) => user.stories, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}
