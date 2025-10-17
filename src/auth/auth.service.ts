import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // 验证输入参数
    if (!username || !password) {
      console.error('validateUser: 缺少用户名或密码参数');
      return null;
    }

    const user = await this.usersRepository.findOne({ where: { username } });

    // 检查用户是否存在
    if (!user) {
      console.error(`validateUser: 用户 ${username} 不存在`);
      return null;
    }

    // 检查用户密码是否存在
    if (!user.password) {
      console.error(`validateUser: 用户 ${username} 的密码字段为空`);
      return null;
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        // 返回用户信息，但不包含密码
        const { password, ...result } = user;
        return result;
      } else {
        console.error(`validateUser: 用户 ${username} 密码验证失败`);
        return null;
      }
    } catch (error) {
      console.error('validateUser: bcrypt.compare 错误:', error);
      return null;
    }
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload);
    return token;
  }

  async createDefaultUser() {
    const existingUser = await this.usersRepository.findOne({
      where: { username: 'admin' },
    });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const user = this.usersRepository.create({
        username: 'admin',
        password: hashedPassword,
      });
      await this.usersRepository.save(user);
      console.log('Default user created: admin/admin123');
    }
  }
}
