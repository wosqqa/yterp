import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SerialService } from './serial.service';

@Controller('serial')
export class SerialController {
  constructor(private readonly serialService: SerialService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.serialService.record(body);
  }

  @Get('exports')
  exports(@Query() query: any) {
    return this.serialService.exports(query);
  }

  @Post('detailRecord')
  detailRecord(@Body() body: any) {
    return this.serialService.detailRecord(body);
  }
}
