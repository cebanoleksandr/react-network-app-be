import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload-url')
  async getUploadUrl(@Body() dto: GetUploadUrlDto) {
    return this.mediaService.createPresignedUrl(dto.fileName, dto.fileType);
  }
}
