import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FastifyReply } from 'fastify';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    try {
      // 验证输入数据
      if (!loginDto || !loginDto.username || !loginDto.password) {
        console.error('login: 登录数据不完整', { loginDto });
        return reply.status(HttpStatus.BAD_REQUEST).send({
          success: false,
          error: '用户名和密码不能为空',
        });
      }

      console.log(`login: 尝试登录用户 ${loginDto.username}`);

      const user = await this.authService.validateUser(
        loginDto.username,
        loginDto.password,
      );

      if (!user) {
        console.error(`login: 用户 ${loginDto.username} 验证失败`);
        return reply.status(HttpStatus.UNAUTHORIZED).send({
          success: false,
          error: '用户名或密码错误',
        });
      }

      console.log(`login: 用户 ${loginDto.username} 验证成功`);

      const token = await this.authService.login(user);

      // Set HttpOnly cookie instead of returning token in response body
      reply.header(
        'Set-Cookie',
        `token=${token}; HttpOnly; Path=/; SameSite=strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      );

      return reply.status(HttpStatus.OK).send({
        success: true,
        data: { user: { id: user.id, username: user.username } },
      });
    } catch (error) {
      console.error('login: 登录过程中发生错误:', error);
      return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: '服务器内部错误',
      });
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.header(
      'Set-Cookie',
      'token=; HttpOnly; Path=/; SameSite=strict; Max-Age=0',
    );
    return reply.status(HttpStatus.OK).send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }
}
