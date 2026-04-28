import { Module } from '@nestjs/common';
import { BreController } from './bre.controller';
import { BreService } from './bre.service';

@Module({
  controllers: [BreController],
  providers: [BreService]
})
export class BreModule {}
