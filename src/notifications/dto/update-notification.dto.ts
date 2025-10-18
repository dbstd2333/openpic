import {
  IsOptional,
  IsBoolean,
  IsString,
  IsIn,
  IsNumber,
  IsDateString,
} from 'class-validator';

/**
 * 更新通知DTO
 */
export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['info', 'warning', 'success', 'error'])
  type?: 'info' | 'warning' | 'success' | 'error';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  linkText?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
