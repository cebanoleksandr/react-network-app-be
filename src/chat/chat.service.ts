import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOrCreateChat(userIds: string[]): Promise<Chat> {
    const chats = await this.chatRepository.find({
      relations: ['participants'],
    });

    const existingChat = chats.find(
      (chat) =>
        chat.participants.length === userIds.length &&
        chat.participants.every((p) => userIds.includes(p.id)),
    );

    if (existingChat) return existingChat;

    const participants = await this.userRepository.findByIds(userIds);
    const newChat = this.chatRepository.create({ participants });
    return this.chatRepository.save(newChat);
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { chat: { id: chatId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async getUserChats(userId: string): Promise<any[]> {
    const chats = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .where(
        'chat.id IN (SELECT "chatsId" FROM chat_participants WHERE "usersId" = :userId)',
        { userId },
      )
      .getMany();

    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.messageRepository
          .createQueryBuilder('message')
          .where('message.chatId = :chatId', { chatId: chat.id })
          .andWhere('message.senderId != :userId', { userId })
          .andWhere('message.isRead = false')
          .getCount();

        const lastMessage = await this.messageRepository.findOne({
          where: { chat: { id: chat.id } },
          relations: ['sender'],
          order: { createdAt: 'DESC' },
        });

        return {
          ...chat,
          unreadCount,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                sender: {
                  id: lastMessage.sender.id,
                  username: lastMessage.sender.username,
                },
              }
            : null,
        };
      }),
    );

    return chatsWithDetails;
  }

  async saveMessage(
    chatId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['participants'],
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!sender) throw new NotFoundException('Sender not found');

    const message = this.messageRepository.create({
      chat,
      sender,
      content,
      isDelivered: true,
      isRead: false,
    });

    return this.messageRepository.save(message);
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('chatId = :chatId', { chatId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();
  }
}
