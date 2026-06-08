import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts/:postId')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('like')
  async toggleLike(@Param('postId') postId: string, @Req() req: any) {
    return this.interactionsService.toggleLike(postId, req.user.id);
  }

  @Get('likes')
  async getLikes(@Param('postId') postId: string) {
    return this.interactionsService.getLikesForPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments')
  async addComment(
    @Param('postId') postId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.interactionsService.addComment(postId, req.user.id, dto);
  }

  @Get('comments')
  async getComments(@Param('postId') postId: string) {
    return this.interactionsService.getCommentsForPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Req() req: any) {
    return this.interactionsService.deleteComment(commentId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('users/:userId/follow')
  async toggleFollow(@Param('userId') targetUserId: string, @Req() req: any) {
    return this.interactionsService.toggleFollow(targetUserId, req.user.id);
  }

  @Get('users/:userId/followers')
  async getFollowers(@Param('userId') userId: string) {
    return this.interactionsService.getFollowers(userId);
  }

  @Get('users/:userId/following')
  async getFollowing(@Param('userId') userId: string) {
    return this.interactionsService.getFollowing(userId);
  }
}
