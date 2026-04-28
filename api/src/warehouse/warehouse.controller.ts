import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('warehouse')
@UseGuards(AuthGuard('jwt'))
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.warehouseService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.warehouseService.save(body, req.user);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.warehouseService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.warehouseService.del(body);
  }
}
