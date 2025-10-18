import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 通知实体类
 * 用于存储横幅通知信息
 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'info' })
  type: 'info' | 'warning' | 'success' | 'error';

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  linkText: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
