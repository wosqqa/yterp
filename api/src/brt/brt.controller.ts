import { Controller, Post, Body, Req } from '@nestjs/common';
import { BrtService } from './brt.service';

@Controller('brt')
export class BrtController {
  constructor(private readonly brtService: BrtService) {}

  @Post('btt')
  btt(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.brtService.btt(body, req.user);
  }

  @Post('bsy')
  bsy(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.brtService.bsy(body, req.user);
  }

  @Post('bbt')
  bbt(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.brtService.bbt(body, req.user);
  }

  @Post('bot')
  bot(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.brtService.bot(body, req.user);
  }

  @Post('blt')
  blt(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.brtService.blt(body, req.user);
  }
}
