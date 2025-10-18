import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { Photo } from './src/entities/photo.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function checkPhotoData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const photoRepository = app.get<Repository<Photo>>(getRepositoryToken(Photo));
    
    // 获取前5张照片的信息
    const photos = await photoRepository.find({
      take: 5,
      order: { createdAt: 'DESC' }
    });
    
    console.log('照片数据:');
    photos.forEach(photo => {
      console.log(`ID: ${photo.id}`);
      console.log(`Path: ${photo.path}`);
      console.log(`ThumbnailPath: ${photo.thumbnailPath}`);
      console.log(`ThumbnailFilename: ${photo.thumbnailFilename}`);
      console.log('---');
    });
  } catch (error) {
    console.error('检查照片数据失败:', error);
  } finally {
    await app.close();
  }
}

checkPhotoData()
  .then(() => {
    console.log('检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('检查失败:', error);
    process.exit(1);
  });