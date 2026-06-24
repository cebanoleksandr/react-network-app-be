import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { MediaType } from 'src/post/entities/post.entity';

export class CreateStoryDto {
  @IsNotEmpty()
  @IsUrl({}, { message: 'Ссылка на медиафайл должна быть валидным URL' })
  mediaUrl: string;

  @IsNotEmpty()
  @IsEnum(MediaType, {
    message: 'Некорректный тип медиафайла (IMAGE, VIDEO, AUDIO)',
  })
  mediaType: MediaType;

  @IsOptional()
  @IsString()
  caption?: string;
}
