import { Module } from '@nestjs/common';
import { SorController } from './sor.controller';
import { SorService } from './sor.service';

@Module({
  controllers: [SorController],
  providers: [SorService],
})
export class SorModule {}

