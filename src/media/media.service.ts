import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private supabase: SupabaseClient;
  private bucketName = 'network';

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      throw new Error('Supabase URL або Service Role Key не задані в .env');
    }

    this.supabase = createClient(url, key);
  }

  async createPresignedUrl(fileName: string, fileType: string) {
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;

    const folder = fileType.startsWith('video/') ? 'videos' : 'images';
    const filePath = `${folder}/${uniqueFileName}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUploadUrl(filePath);

    if (error) {
      throw new BadRequestException(
        `Не вдалося згенерувати посилання: ${error.message}`,
      );
    }

    return {
      uploadUrl: data.signedUrl,
      path: filePath,
      publicUrl: this.getPublicUrl(filePath),
    };
  }

  getPublicUrl(filePath: string): string {
    const url = this.configService.get<string>('SUPABASE_URL');
    return `${url}/storage/v1/object/public/${this.bucketName}/${filePath}`;
  }
}
