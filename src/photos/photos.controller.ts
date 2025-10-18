import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { PhotosService } from './photos.service';
import { AlbumsService } from '../albums/albums.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FastifyReply } from 'fastify';
import { Photo } from '../entities/photo.entity';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { DeletePhotosDto } from './dto/delete-photos.dto';
import { MovePhotosDto } from './dto/move-photos.dto';
import { GenerateThumbnailsDto } from './dto/generate-thumbnails.dto';

@ApiTags('Photos')
@Controller('photos')
export class PhotosController {
  constructor(
    private readonly photosService: PhotosService,
    private readonly albumsService: AlbumsService,
  ) {}

  @Get('album/:albumId')
  @ApiOperation({ summary: 'Get photos by album ID' })
  @ApiParam({ name: 'albumId', description: 'Album ID' })
  @ApiResponse({ status: 200, description: 'Photos retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByAlbum(
    @Param('albumId') albumId: string,
    @Req() req: any,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      // 获取分页参数，默认值为 page=1, pageSize=20
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;

      const photos = await this.photosService.findByAlbum(+albumId, page, pageSize);

      // Increment view count when album photos are accessed
      if (photos.length > 0) {
        await this.albumsService.incrementViewCount(+albumId);
      }

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: photos,
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to fetch photos',
      });
    }
  }

  @Get('photo/:id')
  @ApiOperation({ summary: 'Get photo file by ID' })
  @ApiParam({ name: 'id', description: 'Photo ID' })
  @ApiResponse({
    status: 200,
    description: 'Photo file retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPhotoFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      const photo = await this.photosService.findOne(+id);
      if (!photo) {
        return reply.status(HttpStatus.NOT_FOUND).send({
          success: false,
          error: 'Photo not found',
        });
      }

      // Construct the file path
      const filePath = path.join(process.cwd(), 'public', photo.path);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return reply.status(HttpStatus.NOT_FOUND).send({
          success: false,
          error: 'Photo file not found on disk',
        });
      }

      // Set appropriate headers
      const mimeType = photo.mimeType || 'image/jpeg';
      reply.header('Content-Type', mimeType);
      reply.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      reply.header(
        'Content-Disposition',
        `inline; filename="${photo.originalName}"`,
      );

      // Return the file
      const fileStream = fs.createReadStream(filePath);
      return reply.status(HttpStatus.OK).send(fileStream);
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to fetch photo file',
      });
    }
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Get photo file by filename' })
  @ApiParam({ name: 'filename', description: 'Photo filename' })
  @ApiResponse({
    status: 200,
    description: 'Photo file retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Photo file not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPhotoFileByFilename(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      // 构建文件路径，直接在uploads目录下查找
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return reply.status(HttpStatus.NOT_FOUND).send({
          success: false,
          error: 'Photo file not found on disk',
        });
      }

      // 设置适当的响应头
      const ext = path.extname(filename).toLowerCase();
      let mimeType = 'image/jpeg'; // 默认类型

      // 根据文件扩展名设置MIME类型
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          mimeType = 'image/jpeg';
          break;
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        case '.svg':
          mimeType = 'image/svg+xml';
          break;
      }

      reply.header('Content-Type', mimeType);
      reply.header('Cache-Control', 'public, max-age=31536000'); // 缓存1年
      reply.header('Content-Disposition', `inline; filename="${filename}"`);

      // 返回文件流
      const fileStream = fs.createReadStream(filePath);
      return reply.status(HttpStatus.OK).send(fileStream);
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to fetch photo file',
      });
    }
  }

  @Get('info/:id')
  @ApiOperation({ summary: 'Get photo metadata by ID' })
  @ApiParam({ name: 'id', description: 'Photo ID' })
  @ApiResponse({
    status: 200,
    description: 'Photo metadata retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(
    @Param('id') id: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      const photo = await this.photosService.findOne(+id);
      if (!photo) {
        return reply.status(HttpStatus.NOT_FOUND).send({
          success: false,
          error: 'Photo not found',
        });
      }

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: photo,
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to fetch photo metadata',
      });
    }
  }

  @Post('upload')
  // @UseGuards(JwtAuthGuard) // 临时禁用认证以便调试
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload photos with streaming' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file format or size',
  })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  async uploadFiles(
    @Req() request: any,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      // Check if request is multipart
      if (!request.isMultipart()) {
        return reply.status(HttpStatus.BAD_REQUEST).send({
          success: false,
          error: 'Request must be multipart/form-data',
        });
      }

      const uploadedFiles: Photo[] = [];
      let hasError = false;
      let errorMessage = '';
      let albumId: number | null = null;

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // File validation settings
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      // Process multipart files with proper error handling
      let parts;
      try {
        // Use request.parts() to get both files and fields
        parts = await request.parts();
      } catch (multipartError) {
        return reply.status(HttpStatus.BAD_REQUEST).send({
          success: false,
          error: 'Failed to parse multipart data: ' + multipartError.message,
        });
      }


      for await (const part of parts) {
        if (hasError) break;
        // Check if this is a field (like albumId) or a file
        // Files have a filename property, fields don't
        if (part.filename) {
          // This is a file
          const file = part;

          // Get file extension safely
          const fileExtension = path.extname(file.filename).toLowerCase();

          // 使用原始文件名而不是随机生成的文件名
          // 如果文件已存在，添加时间戳前缀避免冲突
          let filename = file.filename;
          const filePath = path.join(uploadDir, filename);

          // 检查文件是否已存在，如果存在则添加时间戳前缀
          if (fs.existsSync(filePath)) {
            const nameWithoutExt = path.basename(file.filename, fileExtension);
            filename = `${nameWithoutExt}-${Date.now()}${fileExtension}`;
          }

          const finalFilePath = path.join(uploadDir, filename);

          // Validate file type
          if (!allowedMimes.includes(file.mimetype)) {
            hasError = true;
            errorMessage = `Invalid file format for ${file.filename}. Only images are allowed. Current MIME: ${file.mimetype}`;
            break;
          }

          // Save file using Fastify's built-in method
          try {
            // Use the file's built-in save method or convert to buffer
            const buffer = await file.toBuffer();

            // Check file size
            if (buffer.length > maxSize) {
              hasError = true;
              errorMessage = `File ${file.filename} exceeds 10MB limit`;
              break;
            }

            // Write file to disk with correct extension
            fs.writeFileSync(finalFilePath, buffer);
            const size = buffer.length;
            console.log(`✅ 文件已保存: ${finalFilePath} (${size} bytes)`);

            // 检查文件扩展名，如果是webp则不写入数据库
            const isWebpFile = fileExtension === '.webp';
            
            if (!isWebpFile) {
              // Save file info to database with thumbnail generation
              const relativePath = path
                .join('uploads', filename)
                .replace(/\\/g, '/');
              const photoData: Partial<Photo> = {
                filename: file.filename,
                originalName: file.filename,
                path: relativePath,
                size,
                mimeType: file.mimetype,
                albumId: albumId || undefined,
              };

              // 传入文件路径以生成缩略图
              const savedPhoto = await this.photosService.create(photoData, finalFilePath);
              uploadedFiles.push(savedPhoto);
              console.log(
                `✅ 数据库写入成功: id=${savedPhoto.id}, albumId=${savedPhoto.albumId}`,
              );
            } else {
              // webp文件只保存到磁盘，不写入数据库
              console.log(`✅ WebP文件已保存到磁盘，跳过数据库写入: ${filename}`);
            }
          } catch (fileError) {
            hasError = true;
            errorMessage = `Failed to process file ${file.filename}: ${fileError.message}`;
            if (fs.existsSync(finalFilePath)) {
              fs.unlinkSync(finalFilePath); // Clean up partial file
            }
            break;
          }
        } else {
          // This is a form field (like albumId)
          console.log(`📝 处理表单字段: ${part.fieldname}`);

          if (part.fieldname === 'albumId') {
            try {
              // For form fields, the value is available directly as part.value
              const albumIdValue = part.value
                ? part.value.toString().trim()
                : '';
              albumId = parseInt(albumIdValue);
              console.log(
                `📝 获取到albumId字段: "${albumIdValue}" -> ${albumId}`,
              );

              if (isNaN(albumId)) {
                console.log(
                  `⚠️ albumId解析失败: "${albumIdValue}" 不是有效数字`,
                );
                albumId = null;
              }
            } catch (fieldError) {
              console.log(`❌ 解析albumId字段失败:`, fieldError.message);
              albumId = null;
            }
          } else {
            console.log(
              `ℹ️ 忽略其他字段: ${part.fieldname}, value: ${part.value}`,
            );
          }
        }
      }

      console.log(
        `🎯 处理完成，最终albumId: ${albumId}, 上传文件数: ${uploadedFiles.length}`,
      );

      if (hasError) {
        return reply.status(HttpStatus.BAD_REQUEST).send({
          success: false,
          error: errorMessage,
        });
      }

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: {
          files: uploadedFiles,
          message: `${uploadedFiles.length} file(s) uploaded successfully`,
          note: 'WebP files are saved to disk but not stored in database',
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to upload files',
      });
    }
  }

  @Post('delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete photos' })
  @ApiBody({ type: DeletePhotosDto })
  @ApiResponse({ status: 200, description: 'Photos deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no photo IDs provided',
  })
  @ApiResponse({ status: 500, description: 'Delete failed' })
  async deletePhotos(
    @Body() body: DeletePhotosDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      if (!body.ids || body.ids.length === 0) {
        return reply.status(HttpStatus.BAD_REQUEST).send({
          success: false,
          error: 'No photo IDs provided',
        });
      }

      await this.photosService.removeMultiple(body.ids);
      return reply.status(HttpStatus.OK).send({
        success: true,
        data: { message: 'Photos deleted successfully' },
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to delete photos',
      });
    }
  }

  @Post('move')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move photos to another album' })
  @ApiBody({ type: MovePhotosDto })
  @ApiResponse({ status: 200, description: 'Photos moved successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no photo IDs provided',
  })
  @ApiResponse({ status: 500, description: 'Move operation failed' })
  async movePhotos(
    @Body() body: MovePhotosDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      if (!body.photoIds || body.photoIds.length === 0) {
        return reply.status(HttpStatus.BAD_REQUEST).send({
          success: false,
          error: 'No photo IDs provided',
        });
      }

      for (const photoId of body.photoIds) {
        await this.photosService.updatePhotoAlbum(photoId, body.albumId);
      }

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: { message: 'Photos moved successfully' },
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to move photos',
      });
    }
  }

  @Post('generate-thumbnails')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate thumbnails for photos in bulk' })
  @ApiBody({ type: GenerateThumbnailsDto })
  @ApiResponse({ status: 200, description: 'Thumbnails generated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no photo IDs provided',
  })
  @ApiResponse({ status: 500, description: 'Thumbnail generation failed' })
  async generateThumbnails(
    @Body() body: GenerateThumbnailsDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      if (!body.photoIds || body.photoIds.length === 0) {
        return reply.status(HttpStatus.BAD_REQUEST).send({
          success: false,
          error: 'No photo IDs provided',
        });
      }

      const results = await this.photosService.generateThumbnails(body.photoIds);

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: {
          message: 'Thumbnails generated successfully',
          results: results,
        },
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to generate thumbnails',
      });
    }
  }

  @Post('batch-generate-thumbnails')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate thumbnails for all existing photos' })
  @ApiResponse({ status: 200, description: 'Thumbnails generated successfully' })
  @ApiResponse({ status: 500, description: 'Thumbnail generation failed' })
  async batchGenerateThumbnails(
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      const results = await this.photosService.batchGenerateThumbnails();

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: {
          message: 'Batch thumbnail generation completed',
          results: results,
        },
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to generate thumbnails in batch',
      });
    }
  }
}
