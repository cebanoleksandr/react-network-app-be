import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Media } from 'src/media/entities/media.entity';
import { PostsController } from './post.controller';
import { PostsService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Media])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostModule {}
