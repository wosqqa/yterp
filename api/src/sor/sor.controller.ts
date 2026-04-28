import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SorService } from './sor.service';

@Controller('sor')
@UseGuards(AuthGuard('jwt'))
export class SorController {
  constructor(private readonly sorService: SorService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.sorService.record(body, req.user);
  }

  @Post('get')
  get(@Body() body: any, @Req() req: any) {
    return this.sorService.get(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.sorService.save(body, req.user);
  }
}
