import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('summary')
@UseGuards(AuthGuard('jwt'))
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Post('init')
  init() {
    return this.summaryService.init();
  }
}
