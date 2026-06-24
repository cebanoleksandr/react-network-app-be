import { Injectable } from '@nestjs/common';
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
      relations: ['user'],
    });
  }

  async getFeedStories(user: User): Promise<Story[]> {
    const now = new Date();

    const followingIds = user.following?.map((f) => f.following.id) || [];

    if (followingIds.length === 0) {
      return this.storyRepository.find({
        where: { user: { id: user.id }, expiresAt: MoreThan(now) },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.storyRepository.find({
      where: [
        { user: { id: In(followingIds) }, expiresAt: MoreThan(now) },
        { user: { id: user.id }, expiresAt: MoreThan(now) },
      ],
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
