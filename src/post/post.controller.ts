import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './post.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.postsService.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: GetPostsQueryDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.postsService.findAll(query, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/bookmark')
  async toggleBookmark(@Param('id') id: string, @Req() req: any) {
    return this.postsService.toggleBookmark(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookmarked/all')
  async getBookmarked(@Query() query: GetPostsQueryDto, @Req() req: any) {
    return this.postsService.getBookmarkedPosts(req.user.id, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.postsService.remove(id, req.user.id);
  }
}
