import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PeriodService } from './period.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('period')
@UseGuards(AuthGuard('jwt'))
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.periodService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.periodService.save(body, req.user);
  }

  @Post('back')
  back() {
    return this.periodService.back();
  }
}
