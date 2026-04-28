import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { BorService } from './bor.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('bor')
@Controller('bor')
// @UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BorController {
  constructor(private readonly borService: BorService) {}

  @Post('record')
  @ApiOperation({ summary: 'Get Bor List' })
  record(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 1, frame: 1 }; // Mock user for testing
    return this.borService.record(body, req.user);
  }

  @Post('save')
  @ApiOperation({ summary: 'Save Bor' })
  save(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 1, frame: 1 }; // Mock user for testing
    return this.borService.save(body, req.user);
  }
}
