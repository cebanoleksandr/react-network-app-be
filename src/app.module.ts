import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import { User } from './user/entities/user.entity';
import { Media, Post } from './post/entities/post.entity';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { InteractionsModule } from './interactions/interactions.module';
import {
  Comment,
  Follow,
  Like,
} from './interactions/entities/interaction.entity';
import { UsersModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { Bookmark } from './post/entities/bookmark.entity';
import { ChatModule } from './chat/chat.module';
import { Chat } from './chat/entities/chat.entity';
import { Message } from './chat/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          User,
          Post,
          Media,
          Comment,
          Like,
          Follow,
          Bookmark,
          Chat,
          Message,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    AuthModule,
    UsersModule,
    MediaModule,
    PostModule,
    InteractionsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
