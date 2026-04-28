import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { PeriodModule } from '../period/period.module';
import { SysModule } from '../sys/sys.module';

@Module({
  imports: [PeriodModule, SysModule],
  controllers: [SummaryController],
  providers: [SummaryService]
})
export class SummaryModule {}
