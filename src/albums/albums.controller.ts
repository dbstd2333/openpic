import { Controller, Get, Post, Delete, Body, Param, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FastifyReply } from 'fastify';
import { CreateAlbumDto } from './dto/create-album.dto';

@ApiTags('Albums')
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all albums' })
  @ApiResponse({ status: 200, description: 'Albums retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(@Res({ passthrough: true }) reply: FastifyReply) {
    try {
      const albums = await this.albumsService.findAll();
      return reply.status(HttpStatus.OK).send({
        success: true,
        data: albums,
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to fetch albums',
      });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get album by ID' })
  @ApiParam({ name: 'id', description: 'Album ID' })
  @ApiResponse({ status: 200, description: 'Album retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply) {
    try {
      const album = await this.albumsService.findOne(+id);
      if (!album) {
        return reply.status(HttpStatus.NOT_FOUND).send({
          success: false,
          error: 'Album not found',
        });
      }

      // Increment view count when album is accessed
      await this.albumsService.incrementViewCount(+id);

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: album,
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to fetch album',
      });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new album' })
  @ApiBody({ type: CreateAlbumDto })
  @ApiResponse({ status: 201, description: 'Album created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Failed to create album' })
  async create(@Body() createAlbumDto: CreateAlbumDto, @Res({ passthrough: true }) reply: FastifyReply) {
    try {
      const album = await this.albumsService.create(createAlbumDto);
      return reply.status(HttpStatus.CREATED).send({
        success: true,
        data: album,
      });
    } catch (error) {
      console.error('Failed to create album:', error);
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to create album',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an album' })
  @ApiParam({ name: 'id', description: 'Album ID' })
  @ApiResponse({ status: 200, description: 'Album deleted successfully' })
  @ApiResponse({ status: 500, description: 'Failed to delete album' })
  async remove(@Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply) {
    try {
      await this.albumsService.remove(+id);
      return reply.status(HttpStatus.OK).send({
        success: true,
        data: { message: 'Album deleted successfully' },
      });
    } catch (error) {
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: 'Failed to delete album',
      });
    }
  }
}
