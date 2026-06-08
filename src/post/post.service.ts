import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { Post } from './entities/post.entity';
import { Media } from 'src/media/entities/media.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async create(dto: CreatePostDto, user: any) {
    const newPost = this.postRepository.create({
      caption: dto.caption,
      user: { id: user.id },
    });

    const savedPost = await this.postRepository.save(newPost);

    if (dto.media && dto.media.length > 0) {
      const mediaEntities = dto.media.map((m) =>
        this.mediaRepository.create({
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          type: m.type,
          post: savedPost,
        }),
      );
      await this.mediaRepository.save(mediaEntities);
    }

    return this.findOne(savedPost.id);
  }

  async findAll(query: GetPostsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['user', 'media'],
      select: {
        id: true,
        caption: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          bio: true,
        },
        media: {
          id: true,
          url: true,
          thumbnailUrl: true,
          type: true,
        },
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data: posts,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'media'],
      select: {
        id: true,
        caption: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          bio: true,
        },
        media: {
          id: true,
          url: true,
          thumbnailUrl: true,
          type: true,
        },
      },
    });

    if (!post) throw new NotFoundException('Пост не знадено');

    return post;
  }

  async remove(id: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!post) throw new NotFoundException('Пост не знайдено');
    if (post.user.id !== userId)
      throw new ForbiddenException('Ви не можете видалити чужий пост');

    await this.postRepository.remove(post);
    return { message: 'Пост успішно видалено' };
  }
}
