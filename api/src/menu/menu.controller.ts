import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('menu')
@UseGuards(AuthGuard('jwt'))
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('record')
  record() {
    return this.menuService.record();
  }

  @Post('save')
  save(@Body() body: any) {
    return this.menuService.save(body);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.menuService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.menuService.del(body);
  }
}
