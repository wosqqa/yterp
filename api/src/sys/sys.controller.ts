import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SysService } from './sys.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('sys')
@UseGuards(AuthGuard('jwt'))
export class SysController {
  constructor(private readonly sysService: SysService) {}

  @Post('record')
  record() {
    return this.sysService.record();
  }

  @Post('save')
  save(@Body() body: any) {
    return this.sysService.save(body);
  }
}
