import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media, Post } from './entities/post.entity';
import { PostsController } from './post.controller';
import { PostsService } from './post.service';
import { Bookmark } from './entities/bookmark.entity';
import { Comment, Like } from 'src/interactions/entities/interaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Media, Bookmark, Like, Comment])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostModule {}
