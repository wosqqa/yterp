import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit, name, number, tel, add, card, sex, data } = body;
    const where: any = {};

    // Scope filter
    if (user.userId !== 1) {
      where.frame = user.frame;
    }

    if (name) {
      where.OR = [
        { name: { contains: name } },
        { py: { contains: name } }
      ];
    }
    if (number) where.number = { contains: number };
    if (tel) where.tel = { contains: tel };
    if (add) where.add = { contains: add };
    if (card) where.card = { contains: card }; // Updated to match schema
    
    if (sex !== undefined && sex !== '') {
        where.sex = sex === '1' || sex === 1 || sex === true;
    }
    if (data) where.data = { contains: data };

    const count = await this.prisma.people.count({ where });
    const list = await this.prisma.people.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    const frameIds = [...new Set(list.map(item => item.frame))];
    const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });

    const info = list.map(item => ({
      ...item,
      frameData: frames.find(f => f.id === item.frame) || null,
      extension: {
          sex: item.sex ? '男' : '女'
      }
    }));

    return { state: 'success', count, info };
  }

  async save(body: any, user: any) {
    const { id, name, number, sex, tel, add, card, data, more } = body;
    
    const inputData: any = {
        name,
        number,
        tel,
        add,
        card, // Updated to match schema
        sex: sex === '1' || sex === 1 || sex === true,
        data,
        more: typeof more === 'string' ? more : JSON.stringify(more || {}),
        py: name // Simplified
    };

    if (id) {
        await this.prisma.people.update({
            where: { id: Number(id) },
            data: inputData
        });
    } else {
        inputData.frame = user.frame;
        // inputData.user = user.userId; // Removed as not in schema
        await this.prisma.people.create({ data: inputData });
    }
    return { state: 'success' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
        const info = await this.prisma.people.findUnique({ where: { id: Number(id) } });
        return { state: 'success', info };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
    const { parm } = body; // PHP uses parm for batch delete
    if (parm && Array.isArray(parm)) {
        // Check relations
        // TODO: check if used in other tables (e.g. bills)
        
        await this.prisma.people.deleteMany({
            where: { id: { in: parm.map(Number) } }
        });
        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
