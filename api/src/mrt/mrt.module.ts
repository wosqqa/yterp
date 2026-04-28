import { Module } from '@nestjs/common';
import { MrtController } from './mrt.controller';
import { MrtService } from './mrt.service';

@Module({
  controllers: [MrtController],
  providers: [MrtService],
})
export class MrtModule {}

