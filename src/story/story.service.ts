import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Story } from './entities/story.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createStoryDto: CreateStoryDto, user: User): Promise<Story> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = this.storyRepository.create({
      ...createStoryDto,
      user,
      expiresAt,
    });
    const savedStory = await this.storyRepository.save(story);

    return this.storyRepository.findOne({
      where: { id: savedStory.id },
      relations: ['user', 'views'],
    });
  }

  async getFeedStories(user: User): Promise<Story[]> {
    const now = new Date();

    const currentUserWithFollowing = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['following', 'following.following'],
    });

    const followingIds =
      currentUserWithFollowing?.following?.map((f) => f.following.id) || [];

    if (followingIds.length === 0) {
      return this.storyRepository.find({
        where: { user: { id: user.id }, expiresAt: MoreThan(now) },
        relations: ['user', 'views'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.storyRepository.find({
      where: [
        { user: { id: In(followingIds) }, expiresAt: MoreThan(now) },
        { user: { id: user.id }, expiresAt: MoreThan(now) },
      ],
      relations: ['user', 'views'],
      order: { createdAt: 'DESC' },
    });
  }

  async viewStory(storyId: string, user: User) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['views'],
    });

    if (!story) {
      throw new NotFoundException('Історію не знайдено');
    }

    const alreadyViewed = story.views.some((v) => v.id === user.id);

    if (!alreadyViewed) {
      story.views.push(user);
      await this.storyRepository.save(story);
    }

    return { success: true };
  }
}
