import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

/**
 * 通知服务类
 * 处理通知相关的业务逻辑
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  /**
   * 创建新通知
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto);
    
    // 处理过期时间
    if (createNotificationDto.expiresAt) {
      notification.expiresAt = new Date(createNotificationDto.expiresAt);
    }
    
    return this.notificationsRepository.save(notification);
  }

  /**
   * 获取所有通知
   */
  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 获取活跃通知
   */
  async findActive(): Promise<Notification[]> {
    const now = new Date();
    return this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.isActive = :isActive', { isActive: true })
      .andWhere('(notification.expiresAt IS NULL OR notification.expiresAt > :now)', { now })
      .orderBy('notification.priority', 'DESC')
      .addOrderBy('notification.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 根据ID获取通知
   * @param id 通知ID
   * @returns 找到的通知或null
   */
  async findOne(id: number): Promise<Notification | null> {
    return this.notificationsRepository.findOne({ where: { id } });
  }

  /**
   * 更新通知
   * @param id 通知ID
   * @param updateNotificationDto 更新数据
   * @returns 更新后的通知
   * @throws NotFoundException 如果通知不存在
   */
  async update(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new NotFoundException(`通知ID ${id} 不存在`);
    }

    Object.assign(notification, updateNotificationDto);
    return this.notificationsRepository.save(notification);
  }

  /**
   * 删除通知
   */
  async remove(id: number): Promise<void> {
    await this.notificationsRepository.delete(id);
  }
}