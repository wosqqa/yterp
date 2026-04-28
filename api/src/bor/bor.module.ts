import { Module } from '@nestjs/common';
import { BorService } from './bor.service';
import { BorController } from './bor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BorController],
  providers: [BorService],
})
export class BorModule {}
