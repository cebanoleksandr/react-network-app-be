import {
  Controller,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Post,
  Query,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './user.service';
import { GetAllUsersDto } from './dto/get-all-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(@Query() dto: GetAllUsersDto) {
    return this.usersService.getAllUsers(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.usersService.getUserById(req.user.id, true);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('profile/:username')
  async getProfile(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/follow')
  async toggleFollow(@Param('userId') targetUserId: string, @Req() req: any) {
    return this.usersService.toggleFollow(targetUserId, req.user.id);
  }

  @Get(':userId/followers')
  async getFollowers(@Param('userId') userId: string) {
    return this.usersService.getFollowers(userId);
  }

  @Get(':userId/following')
  async getFollowing(@Param('userId') userId: string) {
    return this.usersService.getFollowing(userId);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id, false);
  }
}
