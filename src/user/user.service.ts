import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import { Follow } from 'src/interactions/entities/interaction.entity';
import { GetAllUsersDto } from './dto/get-all-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
  ) {}

  async getAllUsers(dto: GetAllUsersDto) {
    const { page = 1, limit = 10, search } = dto;
    const skip = (page - 1) * limit;

    const fieldsToSelect = {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    };

    let whereCondition: any = {};
    if (search) {
      const searchPattern = `%${search}%`;
      whereCondition = [
        { username: ILike(searchPattern) },
        { firstName: ILike(searchPattern) },
        { lastName: ILike(searchPattern) },
      ];
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: whereCondition,
      select: fieldsToSelect,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data: users,
      meta: {
        totalItems: total,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getUserById(userId: string, isFullProfile = false) {
    const fieldsToSelect = {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      email: isFullProfile,
    };

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: fieldsToSelect,
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) user.bio = dto.bio;

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      avatarUrl: savedUser.avatarUrl,
      bio: savedUser.bio,
      createdAt: savedUser.createdAt,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
    };
  }

  async getProfileByUsername(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    return user;
  }

  async toggleFollow(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('Ви не можете підписатися на самого себе');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new NotFoundException('Користувача не знайдено');

    const existingFollow = await this.followRepository.findOne({
      where: {
        follower: { id: currentUserId },
        following: { id: targetUserId },
      },
    });

    if (existingFollow) {
      await this.followRepository.remove(existingFollow);
      return { followed: false, message: 'Ви відписалися від користувача' };
    } else {
      const newFollow = this.followRepository.create({
        follower: { id: currentUserId },
        following: { id: targetUserId },
      });
      await this.followRepository.save(newFollow);
      return { followed: true, message: 'Ви підписалися на користувача' };
    }
  }

  async getFollowers(userId: string) {
    const followers = await this.followRepository.find({
      where: { following: { id: userId } },
      relations: ['follower'],
      select: {
        id: true,
        createdAt: true,
        follower: { id: true, username: true, avatarUrl: true, bio: true },
      },
    });
    return followers.map((f) => f.follower);
  }

  async getFollowing(userId: string) {
    const following = await this.followRepository.find({
      where: { follower: { id: userId } },
      relations: ['following'],
      select: {
        id: true,
        createdAt: true,
        following: { id: true, username: true, avatarUrl: true, bio: true },
      },
    });
    return following.map((f) => f.following);
  }
}
