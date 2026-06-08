import { MediaType } from '../entities/post.entity';

class MediaDto {
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
}

export class CreatePostDto {
  caption?: string;
  media?: MediaDto[];
}
