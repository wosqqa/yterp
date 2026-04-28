import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('supplier')
@UseGuards(AuthGuard('jwt'))
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.supplierService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.supplierService.save(body, req.user);
  }

  @Post('del')
  del(@Body() body: any, @Req() req: any) {
    return this.supplierService.del(body, req.user);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.supplierService.get(body);
  }
}
