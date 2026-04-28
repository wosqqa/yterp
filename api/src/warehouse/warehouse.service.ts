import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit, name, number, contacts, tel, add, data } = body;
    const where: any = {};

    // Scope filter (Assuming admin id is 1, otherwise filter by frame)
    if (user.userId !== 1) {
      where.frame = user.frame;
    }

    // Build query conditions
    if (name) where.name = { contains: name };
    if (number) where.number = { contains: number };
    if (contacts) where.contacts = { contains: contacts };
    if (tel) where.tel = { contains: tel };
    if (add) where.add = { contains: add };
    if (data) where.data = { contains: data };

    const count = await this.prisma.warehouse.count({ where });
    const list = await this.prisma.warehouse.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    // Manually fetch related data (Frame)
    const frameIds = [...new Set(list.map(item => item.frame))];
    const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });

    const info = list.map(item => ({
      ...item,
      frameData: frames.find(f => f.id === item.frame) || null,
    }));

    return { state: 'success', count, info };
  }

  async save(body: any, user: any) {
    const { id, name, number, contacts, tel, add, data } = body;
    
    // Basic validation
    if (!name) return { state: 'error', info: '仓库名称不能为空!' };

    const inputData: any = {
      name,
      number,
      contacts,
      tel,
      add,
      data,
    };

    if (id) {
        // Update
        await this.prisma.warehouse.update({
            where: { id: Number(id) },
            data: inputData
        });
    } else {
        // Create
        inputData.frame = user.frame;
        await this.prisma.warehouse.create({
            data: inputData
        });
    }
    return { state: 'success' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
      const info = await this.prisma.warehouse.findUnique({ where: { id: Number(id) } });
      if (info) {
          return { state: 'success', info };
      }
      return { state: 'error', info: '数据不存在!' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
    const { id } = body;
    if (id) {
        // Check associations (omitted for now as many tables involved)
        // PHP: checks sor_info, sell_info, sre_info, etc.
        
        await this.prisma.warehouse.delete({ where: { id: Number(id) } });
        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
