import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FrameService } from './frame.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('frame')
@UseGuards(AuthGuard('jwt'))
export class FrameController {
  constructor(private readonly frameService: FrameService) {}

  @Post('record')
  record() {
    return this.frameService.record();
  }

  @Post('save')
  save(@Body() body: any) {
    return this.frameService.save(body);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.frameService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.frameService.del(body);
  }
}
