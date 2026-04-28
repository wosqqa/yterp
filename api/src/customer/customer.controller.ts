import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('customer')
@UseGuards(AuthGuard('jwt'))
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('record')
  @HttpCode(200)
  record(@Body() body: any, @Req() req: any) {
    return this.customerService.record(body, req.user);
  }

  @Post('save')
  @HttpCode(200)
  save(@Body() body: any, @Req() req: any) {
    return this.customerService.save(body, req.user);
  }

  @Post('del')
  @HttpCode(200)
  del(@Body() body: any, @Req() req: any) {
    return this.customerService.del(body, req.user);
  }

  @Post('get')
  @HttpCode(200)
  get(@Body() body: any) {
    return this.customerService.get(body);
  }
}
