import { Body, Controller, Post, Req } from '@nestjs/common';
import { SrtService } from './srt.service';

@Controller('srt')
export class SrtController {
  constructor(private readonly srtService: SrtService) {}

  @Post('stt')
  stt(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.srtService.stt(body, req.user);
  }

  @Post('ssy')
  ssy(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.srtService.ssy(body, req.user);
  }

  @Post('sbt')
  sbt(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.srtService.sbt(body, req.user);
  }
}
