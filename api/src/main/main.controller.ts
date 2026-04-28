import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { MainService } from './main.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('main')
@Controller('main')
export class MainController {
  constructor(private readonly mainService: MainService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('record')
  @ApiOperation({ summary: 'Get Dashboard Record' })
  record(@Request() req) {
    return this.mainService.record(req.user);
  }
}
