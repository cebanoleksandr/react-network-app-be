import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { StoryService } from './story.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateStoryDto } from './dto/create-story.dto';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  async create(@Body() createStoryDto: CreateStoryDto, @Req() req) {
    return this.storyService.create(createStoryDto, req.user);
  }

  @Get('feed')
  async getFeed(@Req() req) {
    return this.storyService.getFeedStories(req.user);
  }
}
