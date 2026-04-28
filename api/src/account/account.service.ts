import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit, name, number, data } = body;
    const where: any = {};

    // Scope filter (Assuming admin id is 1, otherwise filter by frame)
    if (user.userId !== 1) {
      where.frame = user.frame;
    }

    // Build query conditions
    if (name) where.name = { contains: name };
    if (number) where.number = { contains: number };
    if (data) where.data = { contains: data };

    const count = await this.prisma.account.count({ where });
    const list = await this.prisma.account.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    // Manually fetch related data (Frame)
    const frameIds = [...new Set(list.map(item => item.frame))];
    const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });

    const info = list.map(item => {
      // Calculate extension
      const initial = Number(item.initial);
      const balance = Number(item.balance);
      const money = initial + balance;

      return {
        ...item,
        frameData: frames.find(f => f.id === item.frame) || null,
        extension: {
          money: money
        }
      };
    });

    return { state: 'success', count, info };
  }

  async save(body: any, user: any) {
    const { id, name, number, initial, time, data } = body;
    
    // Basic validation
    if (!name) return { state: 'error', info: '账户名称不能为空!' };

    const inputData: any = {
      name,
      number,
      initial: initial ? Number(initial) : 0,
      time: time ? Number(time) : 0,
      data,
    };

    if (id) {
        // Update
        // Prevent balance update (handled by transactions)
        await this.prisma.account.update({
            where: { id: Number(id) },
            data: inputData
        });
    } else {
        // Create
        inputData.frame = user.frame;
        // Default balance to 0 on create
        inputData.balance = 0;
        await this.prisma.account.create({
            data: inputData
        });
    }
    return { state: 'success' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
      const info = await this.prisma.account.findUnique({ where: { id: Number(id) } });
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
        // Check associations (omitted for now)
        // PHP: sell, sre, buy, bre, ice, oce, allot_info
        
        await this.prisma.account.delete({ where: { id: Number(id) } });
        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
