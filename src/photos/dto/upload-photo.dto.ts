import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoDto {
  @ApiProperty({
    description: 'Album ID to upload photos to',
    example: 1,
    required: false,
  })
  albumId?: number;
}
