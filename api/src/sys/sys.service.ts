import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SysService {
  constructor(private prisma: PrismaService) {}

  async getSys(keys?: string[]) {
    const where: any = {};
    if (keys && keys.length > 0) {
        where.name = { in: keys };
    }
    const sysList = await this.prisma.sys.findMany({ where });
    const info = {};
    for (const item of sysList) {
      try {
        info[item.name] = JSON.parse(item.info);
      } catch (e) {
        info[item.name] = item.info;
      }
    }
    return info;
  }

  async record() {
    const info = await this.getSys();
    return { state: 'success', info };
  }

  async save(body: any) {
    if (body && typeof body === 'object') {
      const keys = Object.keys(body);
      const sysRecords = await this.prisma.sys.findMany({
        where: { name: { in: keys } },
        select: { id: true, name: true }
      });

      const updatePromises: any[] = [];
      for (const record of sysRecords) {
        const val = body[record.name];
        
        let infoStr = val;
        if (typeof val === 'object') {
          infoStr = JSON.stringify(val);
        } else {
            infoStr = String(val);
        }

        updatePromises.push(
          this.prisma.sys.update({
            where: { id: record.id },
            data: { info: infoStr }
          })
        );
      }

      try {
        await this.prisma.$transaction(updatePromises);
        return { state: 'success' };
      } catch (e) {
        return { state: 'error', info: '内部错误,操作已撤销!' };
      }
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }
}
