import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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
}
