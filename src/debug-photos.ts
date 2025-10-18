import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Photo } from './entities/photo.entity';
import { DataSource } from 'typeorm';

/**
 * 调试脚本：查看数据库中的照片记录
 */
async function debugPhotoRecords() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const photoRepository = dataSource.getRepository(Photo);

  try {
    console.log('查看数据库中的照片记录...');

    // 获取前10条照片记录
    const photos = await photoRepository.find({ take: 10 });
    console.log(`找到 ${photos.length} 条照片记录`);

    for (const photo of photos) {
      console.log(`照片 ID: ${photo.id}`);
      console.log(`文件名: ${photo.filename}`);
      console.log(`原始文件名: ${photo.originalName}`);
      console.log(`路径: ${photo.path}`);
      console.log(`缩略图路径: ${photo.thumbnailPath}`);
      console.log(`缩略图文件名: ${photo.thumbnailFilename}`);
      console.log('---');
    }
  } catch (error) {
    console.error('查看照片记录时发生错误:', error);
  } finally {
    await app.close();
  }
}

// 运行调试脚本
debugPhotoRecords()
  .then(() => {
    console.log('调试脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('调试脚本执行失败:', error);
    process.exit(1);
  });