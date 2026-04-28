import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('account')
@UseGuards(AuthGuard('jwt'))
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.accountService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.accountService.save(body, req.user);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.accountService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.accountService.del(body);
  }
}
