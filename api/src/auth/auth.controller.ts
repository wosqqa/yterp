import { Controller, Request, Post, UseGuards, Get, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SysService } from '../sys/sys.service';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('api')
@Controller('api')
export class AuthController {
  constructor(
    private authService: AuthService,
    private sysService: SysService
  ) {}

  @Post('captcha')
  @ApiOperation({ summary: 'Get Captcha' })
  async captcha() {
    return this.authService.createCaptcha();
  }

  @Post('runData')
  @ApiOperation({ summary: 'Get Run Data' })
  async runData(@Request() req) {
    // Check login status from token
    // Axios usually sends token in Authorization header if configured
    // PHP version: checkLogin() -> getToken() -> header('token') or get('token')
    // NestJS standard: Authorization: Bearer <token>
    // We should support both if possible, or assume frontend sends it in standard way or custom 'token' header
    // Looking at frontend axios.js might be helpful, but assuming standard or 'token' header.
    
    let token = req.headers.authorization?.replace('Bearer ', '') || '';
    if (!token) {
        token = req.headers.token || ''; // Support 'token' header as used in PHP
    }

    const isLogin = await this.authService.checkLogin(token);
    
    // Get system config
    const sysConfig = await this.sysService.getSys(['name', 'company', 'icp', 'notice']);

    return {
      state: 'success',
      info: {
        login: isLogin,
        sys: sysConfig,
        ver: '7.4.1'
      }
    };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'User Login' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        user: { type: 'string', example: 'admin' }, 
        pwd: { type: 'string', example: '123456' },
        uuid: { type: 'string', example: 'uuid-string' }
      } 
    } 
  })
  async login(@Request() req) {
    // Note: Captcha verification is currently skipped to match PHP logic/frontend behavior
    // If needed, we can verify req.body.uuid against cache here.
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('profile') // This might not match PHP routes, but good for testing
  @ApiOperation({ summary: 'Get Current User Profile' })
  getProfile(@Request() req) {
    return req.user;
  }
}
