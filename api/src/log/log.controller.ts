import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LogService } from './log.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('log')
@UseGuards(AuthGuard('jwt'))
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.logService.record(body, req.user);
  }

  @Post('empty')
  empty() {
    return this.logService.empty();
  }
}
