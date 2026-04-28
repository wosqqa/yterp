import { Module } from '@nestjs/common';
import { SrtController } from './srt.controller';
import { SrtService } from './srt.service';

@Module({
  controllers: [SrtController],
  providers: [SrtService],
})
export class SrtModule {}

