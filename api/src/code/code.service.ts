import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CodeService {
  constructor(private prisma: PrismaService) {}

  async record(body: any) {
    const { page = 1, limit = 10, name, info, type, data } = body;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (info) where.info = { contains: info };
    if (data) where.data = { contains: data };
    if (type !== undefined && type !== '') {
        where.type = type === '1' || type === 1 || type === true;
    }

    const count = await this.prisma.code.count({ where });
    const list = await this.prisma.code.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    const result = list.map(item => ({
        ...item,
        type: item.type ? 1 : 0,
        extension: {
            type: item.type ? '二维码' : '条形码'
        }
    }));

    return { state: 'success', count, info: result };
  }

  async save(body: any) {
    const { id, name, info, type, data } = body;
    
    // Validation is implied by type checking, but basic check:
    // PHP: validate Code
    
    const inputData = {
        name,
        info,
        type: type === '1' || type === 1 || type === true,
        data: data || ''
    };

    if (id) {
        await this.prisma.code.update({
            where: { id: Number(id) },
            data: inputData
        });
    } else {
        await this.prisma.code.create({
            data: inputData
        });
    }
    return { state: 'success' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
      const info = await this.prisma.code.findUnique({ where: { id: Number(id) } });
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
    const { parm } = body;
    if (parm && Array.isArray(parm)) {
        const ids = parm.map(id => Number(id));
        await this.prisma.code.deleteMany({
            where: { id: { in: ids } }
        });
        // Log deletion? Not implemented yet globally.
        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
