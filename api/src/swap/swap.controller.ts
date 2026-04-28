import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { SwapService } from './swap.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('swap')
@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('record')
  @ApiOperation({ summary: 'Get Swap List' })
  record(@Body() body: any, @Request() req) {
    return this.swapService.record(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('save')
  @ApiOperation({ summary: 'Save Swap' })
  save(@Body() body: any, @Request() req) {
    return this.swapService.save(body, req.user);
  }
}