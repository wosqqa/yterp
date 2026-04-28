import { Module } from '@nestjs/common';
import { BrtController } from './brt.controller';
import { BrtService } from './brt.service';

@Module({
  controllers: [BrtController],
  providers: [BrtService]
})
export class BrtModule {}
