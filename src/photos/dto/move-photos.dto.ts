import { ApiProperty } from '@nestjs/swagger';

export class MovePhotosDto {
  @ApiProperty({
    description: 'Array of photo IDs to move',
    example: [1, 2, 3],
    isArray: true,
  })
  photoIds: number[];

  @ApiProperty({
    description: 'Target album ID',
    example: 2,
  })
  albumId: number;
}