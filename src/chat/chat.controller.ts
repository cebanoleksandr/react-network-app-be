import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('room')
  async getOrCreateRoom(@Req() req, @Body('recipientId') recipientId: string) {
    const currentUserId = req.user.id;
    return this.chatService.findOrCreateChat([currentUserId, recipientId]);
  }

  @Get('rooms')
  async getUserRooms(@Req() req) {
    return this.chatService.getUserChats(req.user.id);
  }

  @Get('room/:chatId/messages')
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getChatMessages(chatId);
  }
}
