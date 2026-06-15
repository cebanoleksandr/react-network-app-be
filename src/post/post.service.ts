import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { Media, Post } from './entities/post.entity';
import { Bookmark } from './entities/bookmark.entity';
import { Comment, Like } from 'src/interactions/entities/interaction.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
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

  async findAll(query: GetPostsQueryDto, currentUserId?: string) {
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
          firstName: true,
          lastName: true,
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

    // 2. Оновлюємо мапінг постів: додаємо підрахунок коментарів
    const postsWithMeta = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false;

        // Одночасно запускаємо два прості запити для оптимізації
        const [like, commentsCount] = await Promise.all([
          currentUserId
            ? this.likeRepository.findOne({
                where: { post: { id: post.id }, user: { id: currentUserId } },
              })
            : null,
          this.commentRepository.count({
            where: { post: { id: post.id } },
          }),
        ]);

        if (like) isLiked = true;

        return {
          ...post,
          isLiked,
          commentsCount, // Поле з'явиться на фронтенді
        };
      }),
    );

    return {
      data: postsWithMeta,
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

    if (!post) throw new NotFoundException('Пост не знайдено');

    // 3. Додаємо commentsCount для поодинокого поста
    const commentsCount = await this.commentRepository.count({
      where: { post: { id: post.id } },
    });

    return {
      ...post,
      commentsCount,
    };
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

  async toggleBookmark(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Пост не знайдено');

    const existingBookmark = await this.bookmarkRepository.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });

    if (existingBookmark) {
      await this.bookmarkRepository.remove(existingBookmark);
      return { bookmarked: false, message: 'Пост видалено з обраного' };
    }

    const newBookmark = this.bookmarkRepository.create({
      user: { id: userId },
      post: { id: postId },
    });

    await this.bookmarkRepository.save(newBookmark);
    return { bookmarked: true, message: 'Пост додано в обране' };
  }

  async getBookmarkedPosts(userId: string, query: GetPostsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await this.bookmarkRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['post', 'post.user', 'post.media'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    const posts = bookmarks.map((b) => {
      if (b.post.user) {
        const { ...cleanUser } = b.post.user as any;
        b.post.user = cleanUser;
      }
      return b.post;
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
}
