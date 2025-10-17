import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from '../entities/photo.entity';
import { AlbumsService } from '../albums/albums.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private photosRepository: Repository<Photo>,
    private albumsService: AlbumsService,
  ) {}

  async findByAlbum(albumId: number): Promise<Photo[]> {
    return this.photosRepository.find({
      where: { albumId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Photo | null> {
    return this.photosRepository.findOne({ where: { id } });
  }

  async create(photoData: Partial<Photo>): Promise<Photo> {
    const photo = this.photosRepository.create(photoData);
    const savedPhoto = await this.photosRepository.save(photo);

    if (savedPhoto.albumId) {
      await this.albumsService.incrementPhotoCount(savedPhoto.albumId);
    }

    return savedPhoto;
  }

  async remove(id: number): Promise<void> {
    const photo = await this.photosRepository.findOne({ where: { id } });
    if (photo) {
      // Delete physical file
      const filePath = path.join(process.cwd(), 'public', photo.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Update album photo count
      if (photo.albumId) {
        await this.albumsService.decrementPhotoCount(photo.albumId);
      }

      // Delete database record
      await this.photosRepository.delete(id);
    }
  }

  async removeMultiple(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  async updatePhotoAlbum(photoId: number, albumId: number): Promise<void> {
    const photo = await this.photosRepository.findOne({ where: { id: photoId } });
    if (photo) {
      const oldAlbumId = photo.albumId;
      photo.albumId = albumId;
      await this.photosRepository.save(photo);

      if (oldAlbumId) {
        await this.albumsService.decrementPhotoCount(oldAlbumId);
      }
      if (albumId) {
        await this.albumsService.incrementPhotoCount(albumId);
      }
    }
  }
}
