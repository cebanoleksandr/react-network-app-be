import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment, Follow, Like } from './entities/interaction.entity';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Like, Post, Follow, User])],
  controllers: [InteractionsController],
  providers: [InteractionsService],
})
export class InteractionsModule {}
