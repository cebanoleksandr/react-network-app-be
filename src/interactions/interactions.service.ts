import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment, Follow, Like } from './entities/interaction.entity';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async toggleLike(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Пост не знайдено');

    const existingLike = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      return { liked: false, message: 'Лайк знято' };
    } else {
      const newLike = this.likeRepository.create({
        post: { id: postId },
        user: { id: userId },
      });
      await this.likeRepository.save(newLike);
      return { liked: true, message: 'Лайк поставлено' };
    }
  }

  async getLikesForPost(postId: string) {
    const [likes, count] = await this.likeRepository.findAndCount({
      where: { post: { id: postId } },
      relations: ['user'],
      select: {
        id: true,
        user: { id: true, username: true, avatarUrl: true },
      },
    });

    return { count, likes };
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    if (!dto.text || dto.text.trim() === '') {
      throw new BadRequestException('Текст коментаря не може бути порожнім');
    }

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Пост не знайдено');

    const newComment = this.commentRepository.create({
      text: dto.text,
      post: { id: postId },
      user: { id: userId },
    });

    const savedComment = await this.commentRepository.save(newComment);

    return this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { id: true, username: true, avatarUrl: true },
      },
    });
  }

  async getCommentsForPost(postId: string) {
    return this.commentRepository.find({
      where: { post: { id: postId } },
      relations: ['user'],
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
          avatarUrl: true,
          firstName: true,
          lastName: true,
        },
      },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Коментар не знайдено');

    if (comment.user.id !== userId) {
      throw new ForbiddenException('Ви не можете видалити чужий коментар');
    }

    await this.commentRepository.remove(comment);
    return { message: 'Коментар успішно видалено' };
  }
}
