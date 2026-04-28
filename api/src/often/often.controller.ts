import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { OftenService } from './often.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('often')
@UseGuards(AuthGuard('jwt'))
export class OftenController {
  constructor(private readonly oftenService: OftenService) {}

  @Post('record')
  record(@Req() req: any) {
    return this.oftenService.record(req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.oftenService.save(body, req.user);
  }
}
