import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Photo } from './entities/photo.entity';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 数据库迁移脚本：更新现有照片记录的thumbnailPath字段
 * 确保所有照片记录都有正确的缩略图路径
 */
async function updateThumbnailPaths() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const photoRepository = dataSource.getRepository(Photo);

  try {
    console.log('开始更新照片记录的thumbnailPath字段...');

    // 获取所有照片记录
    const photos = await photoRepository.find();
    console.log(`找到 ${photos.length} 条照片记录`);

    let updatedCount = 0;
    let skippedCount = 0;

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

    console.log(`uploads目录中有 ${uploadsFiles.length} 个文件`);
    console.log(`thumbnails目录中有 ${thumbnailsFiles.length} 个文件`);

    for (const photo of photos) {
      // 如果已经有thumbnailPath，跳过
      if (photo.thumbnailPath) {
        skippedCount++;
        continue;
      }

      // 从原图路径提取文件名前缀
      const pathParts = photo.path.split('/');
      const filename = pathParts[pathParts.length - 1];
      const lastDotIndex = filename.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > -1 ? filename.substring(0, lastDotIndex) : filename;
      
      // 生成缩略图文件名（原图文件名前缀 + .webp）
      const thumbnailFilename = `${nameWithoutExt}.webp`;
      const thumbnailPath = `uploads/thumbnails/${thumbnailFilename}`;

      // 检查缩略图文件是否存在
      const fullThumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
      
      // 如果缩略图存在，更新数据库记录
      if (fs.existsSync(fullThumbnailPath)) {
        photo.thumbnailPath = thumbnailPath;
        photo.thumbnailFilename = thumbnailFilename;
        await photoRepository.save(photo);
        updatedCount++;
        console.log(`已更新照片 ${photo.id}: ${thumbnailPath}`);
      } else {
        // 尝试在uploads目录中查找同名的webp文件（可能是原图本身就是webp格式）
        const webpInUploads = path.join(uploadsDir, thumbnailFilename);
        if (fs.existsSync(webpInUploads)) {
          // 如果原图本身就是webp格式，缩略图路径指向原图
          photo.thumbnailPath = `uploads/${thumbnailFilename}`;
          photo.thumbnailFilename = thumbnailFilename;
          await photoRepository.save(photo);
          updatedCount++;
          console.log(`已更新照片 ${photo.id} (原图为webp): uploads/${thumbnailFilename}`);
        } else {
          // 尝试查找uploads目录中是否有匹配的文件
          const matchingFile = uploadsFiles.find(file => {
            const fileLastDotIndex = file.lastIndexOf('.');
            const fileNameWithoutExt = fileLastDotIndex > -1 ? file.substring(0, fileLastDotIndex) : file;
            return fileNameWithoutExt === nameWithoutExt;
          });

          if (matchingFile) {
            // 找到匹配的文件，检查是否有对应的缩略图
            const matchingLastDotIndex = matchingFile.lastIndexOf('.');
            const matchingNameWithoutExt = matchingLastDotIndex > -1 ? matchingFile.substring(0, matchingLastDotIndex) : matchingFile;
            const matchingThumbnailFilename = `${matchingNameWithoutExt}.webp`;
            const matchingThumbnailPath = path.join(thumbnailsDir, matchingThumbnailFilename);
            
            if (fs.existsSync(matchingThumbnailPath)) {
              // 更新数据库记录，使用实际找到的文件
              photo.path = `uploads/${matchingFile}`;
              photo.thumbnailPath = `uploads/thumbnails/${matchingThumbnailFilename}`;
              photo.thumbnailFilename = matchingThumbnailFilename;
              await photoRepository.save(photo);
              updatedCount++;
              console.log(`已更新照片 ${photo.id} (找到匹配文件): ${matchingFile} -> ${matchingThumbnailFilename}`);
            } else {
              console.warn(`找到匹配文件 ${matchingFile} 但无对应缩略图: ${matchingThumbnailPath}`);
              skippedCount++;
            }
          } else {
            console.warn(`未找到匹配文件: ${nameWithoutExt}`);
            skippedCount++;
          }
        }
      }
    }

    console.log(`更新完成！成功更新 ${updatedCount} 条记录，跳过 ${skippedCount} 条记录`);
  } catch (error) {
    console.error('更新thumbnailPath时发生错误:', error);
  } finally {
    await app.close();
  }
}

// 运行迁移脚本
updateThumbnailPaths()
  .then(() => {
    console.log('迁移脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移脚本执行失败:', error);
    process.exit(1);
  });