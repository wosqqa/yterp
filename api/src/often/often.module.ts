import { Module } from '@nestjs/common';
import { OftenController } from './often.controller';
import { OftenService } from './often.service';

@Module({
  controllers: [OftenController],
  providers: [OftenService]
})
export class OftenModule {}
