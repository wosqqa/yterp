import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { BuyService } from './buy.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('buy')
@Controller('buy')
// @UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BuyController {
  constructor(private readonly buyService: BuyService) {}

  @Post('record')
  @ApiOperation({ summary: 'Get Buy List' })
  record(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 1, frame: 1 }; // Mock user for testing
    return this.buyService.record(body, req.user);
  }

  @Post('save')
  @ApiOperation({ summary: 'Save Buy' })
  save(@Body() body: any, @Req() req: any) {
    req.user = { userId: 1, role: 1, frame: 1 }; // Mock user for testing
    return this.buyService.save(body, req.user);
  }

  @Post('get')
  @ApiOperation({ summary: 'Get Buy Details' })
  get(@Body() body: any) {
    return this.buyService.get(body);
  }

  @Post('del')
  @ApiOperation({ summary: 'Delete Buy' })
  del(@Body() body: any) {
    return this.buyService.del(body);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check Buy' })
  check(@Body() body: any) {
    return this.buyService.check(body);
  }

  @Post('examine')
  @ApiOperation({ summary: 'Examine Buy' })
  examine(@Body() body: any) {
    return this.buyService.examine(body);
  }
}
