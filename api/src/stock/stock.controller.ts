import { Controller, Post, Body, Get, Query, Res, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('stock')
@UseGuards(AuthGuard('jwt'))
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.stockService.record(body);
  }

  @Get('exports')
  async exports(@Query() query: any, @Res() res: Response) {
    const result = await this.stockService.exports(query);
    if (result.state === 'error') {
        return res.json(result);
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('库存列表.xlsx')}`);
    res.send(result.buffer);
  }

  @Post('detailRecord')
  detailRecord(@Body() body: any) {
    return this.stockService.detailRecord(body);
  }

  @Get('detailExports')
  async detailExports(@Query() query: any, @Res() res: Response) {
    const result = await this.stockService.detailExports(query);
    if (result.state === 'error') {
        return res.json(result);
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('库存详情.xlsx')}`);
    res.send(result.buffer);
  }
}
