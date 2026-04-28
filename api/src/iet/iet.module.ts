import { Module } from '@nestjs/common';
import { IetController } from './iet.controller';
import { IetService } from './iet.service';

@Module({
  controllers: [IetController],
  providers: [IetService]
})
export class IetModule {}
