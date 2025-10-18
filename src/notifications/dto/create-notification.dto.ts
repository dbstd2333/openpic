import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';

/**
 * 创建通知DTO
 */
export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsIn(['info', 'warning', 'success', 'error'])
  type?: 'info' | 'warning' | 'success' | 'error' = 'info';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  linkText?: string;

  @IsOptional()
  @IsNumber()
  priority?: number = 0;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
