import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { Photo } from '../entities/photo.entity';
import { AlbumsModule } from '../albums/albums.module';
import { ImageProcessingService } from './image-processing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo]), AlbumsModule],
  providers: [PhotosService, ImageProcessingService],
  controllers: [PhotosController],
  exports: [PhotosService, ImageProcessingService],
})
export class PhotosModule {}
