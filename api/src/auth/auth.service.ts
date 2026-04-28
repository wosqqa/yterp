import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user) {
      // Check password using MD5
      const hash = crypto.createHash('md5').update(pass).digest('hex');
      if (user.pwd === hash) {
        const { pwd, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.user, sub: user.id, role: user.role, frame: user.frame };
    const token = this.jwtService.sign(payload);
    return {
      access_token: token,
      state: 'success',
      info: user,
      token: token // Add token field to match PHP response structure
    };
  }

  async createCaptcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 40,
      background: '#f3fbfe',
    });
    const uuid = crypto.randomUUID();
    // Cache the captcha code with UUID as key
    await this.cacheManager.set(uuid, captcha.text, 300000); // 5 minutes TTL

    return {
      state: 'success',
      info: {
        uuid: uuid,
        data: captcha.data
      }
    };
  }

  async checkLogin(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      return false;
    }
  }
}
