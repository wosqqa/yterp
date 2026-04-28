import { Body, Controller, Post, Req } from '@nestjs/common';
import { MrtService } from './mrt.service';

@Controller('mrt')
export class MrtController {
  constructor(private readonly mrtService: MrtService) {}

  @Post('mpt')
  mpt(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.mrtService.mpt(body, req.user);
  }

  @Post('mot')
  mot(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.mrtService.mot(body, req.user);
  }
}
