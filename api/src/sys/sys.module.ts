import { Module, Global } from '@nestjs/common';
import { SysService } from './sys.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SysController } from './sys.controller';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SysService],
  exports: [SysService],
  controllers: [SysController],
})
export class SysModule {}
