import { ApiProperty } from '@nestjs/swagger';

export class DeletePhotosDto {
  @ApiProperty({
    description: 'Array of photo IDs to delete',
    example: [1, 2, 3],
    isArray: true,
  })
  ids: number[];
}
