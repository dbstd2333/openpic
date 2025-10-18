import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PhotosService } from './photos/photos.service';
import { Photo } from './entities/photo.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 批量生成缩略图脚本
 * 仅在生产环境首次部署时使用，为已有的原图生成缩略图
 * 避免重复生成产生垃圾webp文件
 */
async function generateThumbnails() {
  console.log('🚀 开始批量生成缩略图...');

  try {
    // 创建NestJS应用上下文
    const app = await NestFactory.createApplicationContext(AppModule);
    const photosService = app.get(PhotosService);

    // 直接使用photosRepository获取所有照片记录
    const photos = await photosService['photosRepository'].find();
    console.log(`📊 找到 ${photos.length} 张照片记录`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 处理每张照片
    for (const photo of photos) {
      try {
        // 如果已有缩略图路径，跳过
        if (photo.thumbnailPath) {
          console.log(`⏭️ 照片 ${photo.id} 已有缩略图，跳过`);
          skipCount++;
          continue;
        }

        // 获取原图路径
        const filePath = path.join(process.cwd(), 'public', photo.path);
        if (!fs.existsSync(filePath)) {
          console.log(`❌ 照片 ${photo.id} 原图不存在: ${photo.path}`);
          errorCount++;
          continue;
        }

        // 获取图片信息
        const uploadDir = path.dirname(filePath);
        const filename = path.basename(filePath, path.extname(filePath));
        const thumbnailFilename = `${filename}.webp`;
        const thumbnailPath = path.join(uploadDir, thumbnailFilename);

        // 检查缩略图是否已存在
        if (fs.existsSync(thumbnailPath)) {
          console.log(`⏭️ 照片 ${photo.id} 缩略图已存在，更新数据库记录: ${thumbnailFilename}`);
          // 更新数据库记录
          const thumbnailStats = fs.statSync(thumbnailPath);
          photo.thumbnailPath = `uploads/${thumbnailFilename}`;
          photo.thumbnailFilename = thumbnailFilename;
          photo.thumbnailSize = thumbnailStats.size;
          await photosService['photosRepository'].save(photo);
          successCount++;
          continue;
        }

        // 生成缩略图
        await photosService.generateThumbnails([photo.id]);
        console.log(`✅ 照片 ${photo.id} 缩略图生成成功`);
        successCount++;
      } catch (error) {
        console.error(`❌ 处理照片 ${photo.id} 失败:`, error.message);
        errorCount++;
      }
    }

    console.log('📈 批量生成缩略图完成');
    console.log(`✅ 成功: ${successCount} 张`);
    console.log(`⏭️ 跳过: ${skipCount} 张`);
    console.log(`❌ 失败: ${errorCount} 张`);

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 批量生成缩略图失败:', error);
    process.exit(1);
  }
}

// 执行脚本
generateThumbnails();