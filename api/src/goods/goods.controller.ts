import { Controller, Post, Body, Req, UseGuards, UseInterceptors, UploadedFile, Get, Query, Res } from '@nestjs/common';
import { GoodsService } from './goods.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';

@Controller('goods')
@UseGuards(AuthGuard('jwt'))
export class GoodsController {
  constructor(private readonly goodsService: GoodsService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.goodsService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.goodsService.save(body, req.user);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.goodsService.get(body);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
       if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
           return cb(new Error('Only image files are allowed!'), false);
       }
       cb(null, true);
    }
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.goodsService.upload(file);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
       if (!file.originalname.match(/\.(xlsx)$/)) {
           return cb(new Error('Only xlsx files are allowed!'), false);
       }
       cb(null, true);
    }
  }))
  import(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.goodsService.import(file, req.user);
  }

  @Get('exports')
  async exports(@Query() query: any, @Res() res: Response) {
    const result = await this.goodsService.exports(query);
    if (result.state === 'error') {
        return res.json(result);
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('商品信息.xlsx')}`);
    res.send(result.buffer);
  }
}
