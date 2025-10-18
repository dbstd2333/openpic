import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from '../entities/photo.entity';
import { AlbumsService } from '../albums/albums.service';
import { ImageProcessingService } from './image-processing.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private photosRepository: Repository<Photo>,
    private albumsService: AlbumsService,
    private imageProcessingService: ImageProcessingService,
  ) {}

  async findByAlbum(albumId: number, page = 1, pageSize = 20): Promise<Photo[]> {
    // 计算偏移量
    const skip = (page - 1) * pageSize;

    return this.photosRepository.find({
      where: { albumId },
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });
  }

  async findOne(id: number): Promise<Photo | null> {
    return this.photosRepository.findOne({ where: { id } });
  }

  /**
   * 创建照片记录并生成缩略图
   */
  async create(photoData: Partial<Photo>, filePath?: string): Promise<Photo> {
    const photo = this.photosRepository.create(photoData);

    // 如果提供了文件路径，生成缩略图并获取图片信息
    if (filePath && fs.existsSync(filePath)) {
      try {
        // 获取图片信息
        const metadata = await this.imageProcessingService.getImageInfo(filePath);
        photo.width = metadata.width;
        photo.height = metadata.height;

        // 获取文件名（不带扩展名）
        const originalFilename = path.basename(filePath);
        const filenameWithoutExt = path.basename(filePath, path.extname(filePath));

        // 生成缩略图文件名：使用_thumb后缀，扩展名固定为.webp
        const thumbnailFilename = `${filenameWithoutExt}_thumb.webp`;
        // 缩略图与原图保持在同一目录（扁平化结构）
        const thumbnailPath = path.join(path.dirname(filePath), thumbnailFilename);

        // 检查缩略图是否已存在，如果存在则跳过生成
        if (fs.existsSync(thumbnailPath)) {
          console.log(`缩略图已存在，跳过生成: ${thumbnailFilename}`);
        } else {
          // 生成缩略图
          await this.imageProcessingService.generateThumbnail(
            filePath,
            thumbnailPath,
            400, // 缩略图宽度
            80   // 压缩质量
          );
          console.log(`缩略图生成成功: ${thumbnailPath}`);
        }

        // 获取缩略图大小
        const thumbnailStats = fs.statSync(thumbnailPath);
        // 缩略图路径使用相对路径，与原图在同一目录
        photo.thumbnailPath = `uploads/${thumbnailFilename}`;
        photo.thumbnailFilename = thumbnailFilename;
        photo.thumbnailSize = thumbnailStats.size;

        console.log(`原图文件名: ${originalFilename}, 缩略图文件名: ${thumbnailFilename}`);
      } catch (error) {
        console.error('生成缩略图失败:', error);
        // 不阻止上传过程，只是记录错误
      }
    }

    const savedPhoto = await this.photosRepository.save(photo);

    if (savedPhoto.albumId) {
      await this.albumsService.incrementPhotoCount(savedPhoto.albumId);
    }

    return savedPhoto;
  }

  async remove(id: number): Promise<void> {
    const photo = await this.photosRepository.findOne({ where: { id } });
    if (photo) {
      // 删除原图文件
      const filePath = path.join(process.cwd(), 'public', photo.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 删除缩略图文件
      if (photo.thumbnailPath) {
        const thumbnailFilePath = path.join(process.cwd(), 'public', photo.thumbnailPath);
        if (fs.existsSync(thumbnailFilePath)) {
          fs.unlinkSync(thumbnailFilePath);
        }
      }

      // 更新相册照片数量
      if (photo.albumId) {
        await this.albumsService.decrementPhotoCount(photo.albumId);
      }

      // 删除数据库记录
      await this.photosRepository.delete(id);
    }
  }

  async removeMultiple(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  async updatePhotoAlbum(photoId: number, albumId: number): Promise<void> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
    });
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

  /**
   * 为指定照片ID列表生成缩略图
   */
  async generateThumbnails(photoIds: number[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const photoId of photoIds) {
      try {
        const photo = await this.photosRepository.findOne({ where: { id: photoId } });
        if (!photo) {
          result.failed++;
          result.errors.push(`Photo with ID ${photoId} not found`);
          continue;
        }

        // 如果已有缩略图，跳过
        if (photo.thumbnailPath) {
          result.errors.push(`Photo with ID ${photoId} already has a thumbnail`);
          continue;
        }

        // 获取原图路径
        const filePath = path.join(process.cwd(), 'public', photo.path);
        if (!fs.existsSync(filePath)) {
          result.failed++;
          result.errors.push(`Original file not found for photo ID ${photoId}`);
          continue;
        }

        // 获取图片信息
        const metadata = await this.imageProcessingService.getImageInfo(filePath);
        photo.width = metadata.width;
        photo.height = metadata.height;

        // 生成缩略图
        const filename = path.basename(filePath, path.extname(filePath));
        const thumbnailFilename = `${filename}_thumb.webp`;
        // 缩略图与原图保持在同一目录（扁平化结构）
        const thumbnailPath = path.join(path.dirname(filePath), thumbnailFilename);

        // 检查缩略图是否已存在，如果存在则跳过生成
        if (fs.existsSync(thumbnailPath)) {
          console.log(`缩略图已存在，跳过生成: ${thumbnailFilename}`);
          photo.thumbnailPath = `uploads/${thumbnailFilename}`;
          photo.thumbnailFilename = thumbnailFilename;
          const thumbnailStats = fs.statSync(thumbnailPath);
          photo.thumbnailSize = thumbnailStats.size;
          await this.photosRepository.save(photo);
          result.success++;
          continue;
        }

        await this.imageProcessingService.generateThumbnail(
          filePath,
          thumbnailPath,
          400, // 缩略图宽度
          80   // 压缩质量
        );

        // 获取缩略图大小
        const thumbnailStats = fs.statSync(thumbnailPath);
        // 缩略图路径使用相对路径，与原图在同一目录
        photo.thumbnailPath = `uploads/${thumbnailFilename}`;
        photo.thumbnailFilename = thumbnailFilename;
        photo.thumbnailSize = thumbnailStats.size;

        // 保存更新后的照片信息
        await this.photosRepository.save(photo);

        result.success++;
        console.log(`缩略图生成成功: ${thumbnailPath}`);
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to generate thumbnail for photo ID ${photoId}: ${error.message}`);
        console.error(`生成照片 ${photoId} 缩略图失败:`, error);
      }
    }

    return result;
  }

  /**
   * 批量为现有照片生成缩略图
   */
  async batchGenerateThumbnails(): Promise<{ success: number; failed: number; errors: string[] }> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // 使用ImageProcessingService批量生成缩略图，保持扁平化结构
    const result = await this.imageProcessingService.batchGenerateThumbnails(
      uploadDir,
      uploadDir, // 输出到同一目录，保持扁平化结构
      '_thumb'   // 使用_thumb后缀
    );

    // 更新数据库中的缩略图信息
    if (result.success > 0) {
      await this.updateThumbnailInfoInDatabase();
    }

    return result;
  }

  /**
   * 更新数据库中的缩略图信息
   */
  private async updateThumbnailInfoInDatabase(): Promise<void> {
    const photos = await this.photosRepository.find({
      where: { thumbnailPath: undefined } // 只更新没有缩略图路径的照片
    });

    for (const photo of photos) {
      try {
        const filePath = path.join(process.cwd(), 'public', photo.path);
        if (fs.existsSync(filePath)) {
          const filename = path.basename(filePath, path.extname(filePath));
          const thumbnailFilename = `${filename}_thumb.webp`;
          const thumbnailPath = path.join('uploads', thumbnailFilename);
          const thumbnailFilePath = path.join(process.cwd(), 'public', thumbnailPath);

          // 如果缩略图文件存在，更新数据库记录
          if (fs.existsSync(thumbnailFilePath)) {
            const thumbnailStats = fs.statSync(thumbnailFilePath);
            photo.thumbnailPath = thumbnailPath;
            photo.thumbnailFilename = thumbnailFilename;
            photo.thumbnailSize = thumbnailStats.size;

            await this.photosRepository.save(photo);
            console.log(`更新照片 ${photo.id} 的缩略图信息: ${thumbnailPath}`);
          }
        }
      } catch (error) {
        console.error(`更新照片 ${photo.id} 缩略图信息失败:`, error);
      }
    }
  }
}
