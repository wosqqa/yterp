import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('attribute')
@UseGuards(AuthGuard('jwt'))
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.attributeService.record(body);
  }

  @Post('save')
  save(@Body() body: any) {
    return this.attributeService.save(body);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.attributeService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.attributeService.del(body);
  }

  @Post('select')
  select() {
    return this.attributeService.select();
  }
}
