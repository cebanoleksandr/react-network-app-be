import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody('chatId') chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(chatId);
    console.log(`Client ${client.id} joined chat room: ${chatId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { chatId: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.chatId).emit('userTyping', {
      chatId: data.chatId,
      username: data.username,
      isTyping: true,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { chatId: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.chatId).emit('userTyping', {
      chatId: data.chatId,
      username: data.username,
      isTyping: false,
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; senderId: string; content: string },
  ) {
    const savedMessage = await this.chatService.saveMessage(
      data.chatId,
      data.senderId,
      data.content,
    );

    const messagePayload = {
      id: savedMessage.id,
      chatId: data.chatId,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt,
      isDelivered: savedMessage.isDelivered,
      isRead: savedMessage.isRead,
      sender: {
        id: savedMessage.sender.id,
        username: savedMessage.sender.username,
        avatarUrl: savedMessage.sender.avatarUrl,
      },
    };

    this.server.to(data.chatId).emit('newMessage', messagePayload);

    if (savedMessage.chat && savedMessage.chat.participants) {
      savedMessage.chat.participants.forEach((participant) => {
        this.server
          .to(`user_inbox_${participant.id}`)
          .emit('newMessage', messagePayload);
      });
    }
  }

  @SubscribeMessage('readMessages')
  async handleReadMessages(
    @MessageBody() data: { chatId: string; userId: string },
  ) {
    await this.chatService.markAsRead(data.chatId, data.userId);

    this.server.to(data.chatId).emit('messagesRead', {
      chatId: data.chatId,
      readerId: data.userId,
    });
  }
}
