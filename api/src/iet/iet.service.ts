import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IetService {
  constructor(private prisma: PrismaService) {}

  async record(body: any) {
    const { page = 1, limit = 10, name, type } = body;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (type !== undefined && type !== '') {
        where.type = type === '1' || type === 1 || type === true;
    }

    const count = await this.prisma.iet.count({ where });
    const list = await this.prisma.iet.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: [
          { sort: 'asc' },
          { id: 'desc' }
      ],
    });

    const info = list.map(item => ({
        ...item,
        type: item.type ? 1 : 0,
        extension: {
            type: item.type ? '支出' : '收入' // 0:收入, 1:支出
        }
    }));

    return { state: 'success', count, info };
  }

  async save(body: any) {
    const { id, name, type, sort, data } = body;
    if (name) {
      const inputData = {
          name,
          type: type === '1' || type === 1 || type === true,
          sort: sort ? Number(sort) : 0,
          data: data || ''
      };

      if (id) {
        await this.prisma.iet.update({
            where: { id: Number(id) },
            data: inputData
        });
      } else {
        await this.prisma.iet.create({
            data: inputData
        });
      }
      return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
      const info = await this.prisma.iet.findUnique({ where: { id: Number(id) } });
      if (info) {
          return {
              state: 'success',
              info: {
                  ...info,
                  type: info.type ? 1 : 0
              }
          };
      }
      return { state: 'error', info: '数据不存在!' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
    const { id } = body;
    if (id) {
      // Check associations
      // PHP checks: cost, ice_info, oce_info
      // We check cost. ice_info/oce_info not in schema yet.
      
      const cost = await this.prisma.cost.findFirst({ where: { iet: Number(id) } });
      if (cost) {
          return { state: 'error', info: '存在数据关联,删除失败!' };
      }

      await this.prisma.iet.delete({ where: { id: Number(id) } });
      return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
