import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiResponse as ApiResponseWrapper } from '../common/api-response';

/**
 * 通知控制器
 * 处理通知相关的HTTP请求
 */
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * 创建新通知
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建新通知' })
  @ApiResponse({ status: 201, description: '通知创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '禁止访问' })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    const notification = await this.notificationsService.create(
      createNotificationDto,
    );
    return ApiResponseWrapper.success(notification, '通知创建成功');
  }

  /**
   * 获取所有通知
   */
  @Get()
  @ApiOperation({ summary: '获取所有通知' })
  @ApiResponse({ status: 200, description: '获取通知列表成功' })
  async findAll() {
    const notifications = await this.notificationsService.findAll();
    return ApiResponseWrapper.success(notifications);
  }

  /**
   * 获取活跃通知
   */
  @Get('active')
  @ApiOperation({ summary: '获取活跃通知' })
  @ApiResponse({ status: 200, description: '获取活跃通知列表成功' })
  async findActive() {
    const notifications = await this.notificationsService.findActive();
    return ApiResponseWrapper.success(notifications);
  }

  /**
   * 根据ID获取通知
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取通知' })
  @ApiResponse({ status: 200, description: '获取通知成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async findOne(@Param('id') id: string) {
    const notification = await this.notificationsService.findOne(+id);
    if (!notification) {
      return ApiResponseWrapper.error('通知不存在');
    }
    return ApiResponseWrapper.success(notification);
  }

  /**
   * 更新通知
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新通知' })
  @ApiResponse({ status: 200, description: '通知更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '禁止访问' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationsService.update(
      +id,
      updateNotificationDto,
    );
    if (!notification) {
      return ApiResponseWrapper.error('通知不存在');
    }
    return ApiResponseWrapper.success(notification, '通知更新成功');
  }

  /**
   * 删除通知
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 204, description: '通知删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '禁止访问' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async remove(@Param('id') id: string) {
    try {
      await this.notificationsService.remove(+id);
      return ApiResponseWrapper.success(null, '通知删除成功');
    } catch (error) {
      return ApiResponseWrapper.error('通知不存在');
    }
  }
}
