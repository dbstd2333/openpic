/**
 * API响应包装器类
 * 用于统一API响应格式
 */
export class ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;

  constructor(success: boolean, data: T, message?: string) {
    this.success = success;
    this.data = data;
    this.message = message;
  }

  /**
   * 创建成功响应
   */
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  /**
   * 创建失败响应
   */
  static error<T>(message?: string): ApiResponse<T | null> {
    return new ApiResponse(false, null as any, message);
  }
}