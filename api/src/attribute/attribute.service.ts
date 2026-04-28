import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttributeService {
  constructor(private prisma: PrismaService) {}

  async record(body: any) {
    const { page = 1, limit = 10, name, data } = body;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (data) where.data = { contains: data };

    const count = await this.prisma.attribute.count({ where });
    const list = await this.prisma.attribute.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { sort: 'asc' },
    });

    return { state: 'success', count, info: list };
  }

  async save(body: any) {
    const { id, name, sort, data, info } = body;
    // Basic validation
    if (!name) return { state: 'error', info: '传入参数不完整!' };

    const inputData = {
        name,
        sort: sort ? Number(sort) : 0,
        data: data || ''
    };

    if (id) {
        // Validation for associations on update (omitted for now as 'attr' table not in schema)
        // PHP: checks 'attr' table for existing usage if options changed.
        
        await this.prisma.attribute.update({
            where: { id: Number(id) },
            data: inputData
        });

        // Update info: delete all and re-insert
        await this.prisma.attributeInfo.deleteMany({ where: { pid: Number(id) } });
        if (info && Array.isArray(info)) {
            const infoData = info.map((item: any) => ({
                pid: Number(id),
                name: item.name
            }));
            await this.prisma.attributeInfo.createMany({ data: infoData });
        }
    } else {
        const created = await this.prisma.attribute.create({
            data: inputData
        });
        
        if (info && Array.isArray(info)) {
            const infoData = info.map((item: any) => ({
                pid: created.id,
                name: item.name
            }));
            await this.prisma.attributeInfo.createMany({ data: infoData });
        }
    }
    return { state: 'success' };
  }

  async get(body: any) {
      const { id } = body;
      if (id) {
          const info = await this.prisma.attribute.findUnique({ where: { id: Number(id) } });
          if (info) {
              const details = await this.prisma.attributeInfo.findMany({ where: { pid: Number(id) } });
              return { 
                  state: 'success', 
                  info: { ...info, info: details } 
              };
          }
          return { state: 'error', info: '数据不存在!' };
      }
      return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
      const { id } = body;
      if (id) {
          // Check associations (omitted as 'attr' table not in schema)
          
          await this.prisma.attributeInfo.deleteMany({ where: { pid: Number(id) } });
          await this.prisma.attribute.delete({ where: { id: Number(id) } });
          return { state: 'success' };
      }
      return { state: 'error', info: '传入参数不完整!' };
  }

  async select() {
    const attributes = await this.prisma.attribute.findMany({
      orderBy: { sort: 'asc' },
    });

    const attributeIds = attributes.map((attr) => attr.id);
    const infos = await this.prisma.attributeInfo.findMany({
      where: { pid: { in: attributeIds } },
    });

    const info = attributes.map((attr) => {
      return {
        ...attr,
        info: infos.filter((i) => i.pid === attr.id),
      };
    });

    return { state: 'success', info };
  }
}

