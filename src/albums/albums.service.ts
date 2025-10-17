import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Album } from '../entities/album.entity';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private albumsRepository: Repository<Album>,
  ) {}

  async findAll(): Promise<Album[]> {
    return this.albumsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Album | null> {
    return this.albumsRepository.findOne({ where: { id } });
  }

  async create(albumData: Partial<Album>): Promise<Album> {
    if (!albumData.name || albumData.name.trim() === '') {
      throw new Error('Album name is required');
    }

    const album = this.albumsRepository.create({
      name: albumData.name.trim(),
      description: albumData.description?.trim() || undefined,
    });
    return this.albumsRepository.save(album);
  }

  async update(id: number, albumData: Partial<Album>): Promise<Album | null> {
    await this.albumsRepository.update(id, albumData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.albumsRepository.delete(id);
  }

  async incrementPhotoCount(albumId: number): Promise<void> {
    await this.albumsRepository.increment({ id: albumId }, 'photoCount', 1);
  }

  async decrementPhotoCount(albumId: number): Promise<void> {
    await this.albumsRepository.decrement({ id: albumId }, 'photoCount', 1);
  }

  async incrementViewCount(albumId: number): Promise<void> {
    await this.albumsRepository.increment({ id: albumId }, 'viewCount', 1);
  }
}
