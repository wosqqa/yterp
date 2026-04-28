import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { BatchService } from './batch.service';

@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.batchService.record(body);
  }

  @Get('exports')
  exports(@Query() query: any) {
    return this.batchService.exports(query);
  }

  @Post('detailRecord')
  detailRecord(@Body() body: any) {
    return this.batchService.detailRecord(body);
  }
}
