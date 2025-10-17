import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth/auth.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(private authService: AuthService) {}

  async onModuleInit() {
    await this.authService.createDefaultUser();
  }
}