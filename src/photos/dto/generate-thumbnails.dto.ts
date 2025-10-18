import { ApiProperty } from '@nestjs/swagger';

export class GenerateThumbnailsDto {
  @ApiProperty({
    description: 'Array of photo IDs to generate thumbnails for',
    example: [1, 2, 3],
    isArray: true,
  })
  photoIds: number[];
}