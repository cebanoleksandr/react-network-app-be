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
  Patch,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './post.service';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.postsService.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, req.user.id, dto);
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

  @UseGuards(JwtAuthGuard)
  @Get('favorite/all')
  async getFavorites(@Query() query: GetPostsQueryDto, @Req() req: any) {
    return this.postsService.getFavoritePosts(req.user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.postsService.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.postsService.remove(id, req.user.id);
  }
}
