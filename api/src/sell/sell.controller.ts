import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SellService } from './sell.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('sell')
@UseGuards(AuthGuard('jwt'))
export class SellController {
  constructor(private readonly sellService: SellService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.sellService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.sellService.save(body, req.user);
  }
  
  @Post('get')
  get(@Body() body: any, @Req() req: any) {
    return this.sellService.get(body, req.user);
  }

  @Post('del')
  del(@Body() body: any, @Req() req: any) {
    return this.sellService.del(body, req.user);
  }

  @Post('check')
  check(@Body() body: any, @Req() req: any) {
    return this.sellService.check(body, req.user);
  }

  @Post('examine')
  examine(@Body() body: any, @Req() req: any) {
    return this.sellService.examine(body, req.user);
  }
}
