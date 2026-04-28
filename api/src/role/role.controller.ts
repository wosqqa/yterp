import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('role')
@UseGuards(AuthGuard('jwt'))
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('record')
  record(@Body() body: any) {
    return this.roleService.record(body);
  }

  @Post('save')
  save(@Body() body: any) {
    return this.roleService.save(body);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.roleService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.roleService.del(body);
  }
}
