import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SerialService {
  constructor(private prisma: PrismaService) {}

  async record(body: any) {
    return { state: 'success', count: 0, info: [] };
  }

  async exports(query: any) {
    return { state: 'error', info: '暂未实现' };
  }

  async detailRecord(body: any) {
    return { state: 'error', info: '暂未实现' };
  }
}
