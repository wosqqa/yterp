import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { BreService } from './bre.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('bre')
@UseGuards(AuthGuard('jwt'))
export class BreController {
  constructor(private readonly breService: BreService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.breService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.breService.save(body, req.user);
  }
  
  @Post('get')
  get(@Body() body: any) {
    return this.breService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.breService.del(body);
  }

  @Post('check')
  check(@Body() body: any) {
    return this.breService.check(body);
  }

  @Post('examine')
  examine(@Body() body: any) {
    return this.breService.examine(body);
  }
}
