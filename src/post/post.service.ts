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
import { UpdatePostDto } from './dto/update-post.dto';

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

    const postsWithMeta = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false;
        let isBookmarked = false;

        const [like, bookmark, commentsCount] = await Promise.all([
          currentUserId
            ? this.likeRepository.findOne({
                where: { post: { id: post.id }, user: { id: currentUserId } },
              })
            : null,
          currentUserId
            ? this.bookmarkRepository.findOne({
                where: { post: { id: post.id }, user: { id: currentUserId } },
              })
            : null,
          this.commentRepository.count({
            where: { post: { id: post.id } },
          }),
        ]);

        if (like) isLiked = true;
        if (bookmark) isBookmarked = true;

        return {
          ...post,
          isLiked,
          isBookmarked,
          commentsCount,
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

  async findOne(id: string, currentUserId?: string) {
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
    });

    if (!post) throw new NotFoundException('Пост не знайдено');

    const [commentsCount, bookmark] = await Promise.all([
      this.commentRepository.count({ where: { post: { id: post.id } } }),
      currentUserId
        ? this.bookmarkRepository.findOne({
            where: { post: { id: post.id }, user: { id: currentUserId } },
          })
        : null,
    ]);

    return {
      ...post,
      commentsCount,
      isBookmarked: !!bookmark,
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
      return {
        ...b.post,
        isBookmarked: true,
      };
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

  async getFavoritePosts(userId: string, query: GetPostsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [likes, total] = await this.likeRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['post', 'post.user', 'post.media'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    const posts = await Promise.all(
      likes.map(async (like) => {
        const post = like.post;

        const bookmark = await this.bookmarkRepository.findOne({
          where: { post: { id: post.id }, user: { id: userId } },
        });

        const commentsCount = await this.commentRepository.count({
          where: { post: { id: post.id } },
        });

        return {
          id: post.id,
          caption: post.caption,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          user: post.user
            ? {
                id: post.user.id,
                username: post.user.username,
                email: post.user.email,
                avatarUrl: post.user.avatarUrl,
                bio: post.user.bio,
              }
            : null,
          media: post.media || [],
          isLiked: true,
          isBookmarked: !!bookmark,
          commentsCount,
        };
      }),
    );

    return {
      data: posts,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'media'],
    });

    if (!post) throw new NotFoundException('Пост не знайдено');

    if (post.user.id !== userId) {
      throw new ForbiddenException('Ви не можете редагувати чужий пост');
    }

    if (dto.caption !== undefined) {
      post.caption = dto.caption;
    }

    if (dto.media) {
      if (post.media && post.media.length > 0) {
        await this.mediaRepository.remove(post.media);
      }

      if (dto.media.length > 0) {
        const newMediaEntities = dto.media.map((m) =>
          this.mediaRepository.create({
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            type: m.type,
            post: post,
          }),
        );
        post.media = await this.mediaRepository.save(newMediaEntities);
      } else {
        post.media = [];
      }
    }

    await this.postRepository.save(post);

    return this.findOne(id, userId);
  }
}
