import { Controller, Post, Body, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.usersService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.usersService.save(body, req.user);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.usersService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.usersService.del(body);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/user';
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  upload(@UploadedFile() file: any) {
    return {
      state: 'success',
      info: `/static/upload/user/${file.filename}`
    };
  }
}
