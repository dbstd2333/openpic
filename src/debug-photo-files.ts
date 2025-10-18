import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Photo } from './entities/photo.entity';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 调试脚本：详细检查数据库记录与实际文件的匹配情况
 */
async function debugPhotoFiles() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const photoRepository = dataSource.getRepository(Photo);

  try {
    console.log('开始调试照片文件匹配情况...');

    // 获取uploads目录中的所有文件
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const uploadsFiles = fs.readdirSync(uploadsDir).filter(file => {
      const filePath = path.join(uploadsDir, file);
      return fs.statSync(filePath).isFile();
    });

    // 获取thumbnails目录中的所有文件
    const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
    let thumbnailsFiles: string[] = [];
    
    if (fs.existsSync(thumbnailsDir)) {
      thumbnailsFiles = fs.readdirSync(thumbnailsDir).filter(file => {
        const filePath = path.join(thumbnailsDir, file);
        return fs.statSync(filePath).isFile();
      });
    }

    console.log(`uploads目录中有 ${uploadsFiles.length} 个文件:`);
    uploadsFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log(`\nthumbnails目录中有 ${thumbnailsFiles.length} 个文件:`);
    thumbnailsFiles.forEach(file => console.log(`  - ${file}`));

    // 获取前10条照片记录
    const photos = await photoRepository.find({ take: 10 });
    
    console.log(`\n数据库中的前10条照片记录:`);
    for (const photo of photos) {
      console.log(`\n照片 ID: ${photo.id}`);
      console.log(`  原图路径: ${photo.path}`);
      console.log(`  文件名: ${photo.filename}`);
      console.log(`  原始文件名: ${photo.originalName}`);
      console.log(`  缩略图路径: ${photo.thumbnailPath}`);
      console.log(`  缩略图文件名: ${photo.thumbnailFilename}`);
      
      // 检查原图文件是否存在
      const pathParts = photo.path.split('/');
      const filename = pathParts[pathParts.length - 1];
      const fullOriginalPath = path.join(uploadsDir, filename);
      console.log(`  原图文件完整路径: ${fullOriginalPath}`);
      console.log(`  原图文件存在: ${fs.existsSync(fullOriginalPath)}`);
      
      // 检查缩略图文件是否存在
      if (photo.thumbnailPath) {
        const thumbnailPathParts = photo.thumbnailPath.split('/');
        const thumbnailFilename = thumbnailPathParts[thumbnailPathParts.length - 1];
        const fullThumbnailPath = path.join(process.cwd(), 'public', photo.thumbnailPath);
        console.log(`  缩略图文件完整路径: ${fullThumbnailPath}`);
        console.log(`  缩略图文件存在: ${fs.existsSync(fullThumbnailPath)}`);
      }
    }
  } catch (error) {
    console.error('调试时发生错误:', error);
  } finally {
    await app.close();
  }
}

// 运行调试脚本
debugPhotoFiles()
  .then(() => {
    console.log('调试脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('调试脚本执行失败:', error);
    process.exit(1);
  });