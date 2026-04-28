import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IetService } from './iet.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('iet')
@UseGuards(AuthGuard('jwt'))
export class IetController {
  constructor(private readonly ietService: IetService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.ietService.record(body);
  }

  @Post('save')
  save(@Body() body: any) {
    return this.ietService.save(body);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.ietService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.ietService.del(body);
  }
}
