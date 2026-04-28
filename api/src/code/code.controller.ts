import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CodeService } from './code.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('code')
@UseGuards(AuthGuard('jwt'))
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.codeService.record(body);
  }

  @Post('save')
  save(@Body() body: any) {
    return this.codeService.save(body);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.codeService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.codeService.del(body);
  }
}
