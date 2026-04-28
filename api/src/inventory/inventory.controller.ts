import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.inventoryService.record(body);
  }

  @Get('exports')
  exports(@Query() query: any) {
    return this.inventoryService.exports(query);
  }

  @Post('buildEntry')
  buildEntry(@Body() body: any) {
    return this.inventoryService.buildEntry(body);
  }

  @Post('buildExtry')
  buildExtry(@Body() body: any) {
    return this.inventoryService.buildExtry(body);
  }
}
