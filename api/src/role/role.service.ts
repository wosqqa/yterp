import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async record(body: any) {
    const { page, limit, name, data } = body;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (data) where.data = { contains: data };

    const count = await this.prisma.role.count({ where });
    const list = await this.prisma.role.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    return { state: 'success', count, info: list };
  }

  async save(body: any) {
    const { id, name, root, auth, data } = body;
    if (name) {
      if (id) {
          await this.prisma.role.update({
              where: { id: Number(id) },
              data: {
                  name,
                  root: typeof root === 'string' ? root : JSON.stringify(root || {}),
                  auth: typeof auth === 'string' ? auth : JSON.stringify(auth || {}),
                  data: data || ''
              }
          });
      } else {
          await this.prisma.role.create({
              data: {
                  name,
                  root: typeof root === 'string' ? root : JSON.stringify(root || {}),
                  auth: typeof auth === 'string' ? auth : JSON.stringify(auth || {}),
                  data: data || ''
              }
          });
      }
      return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
        const info: any = await this.prisma.role.findUnique({ where: { id: Number(id) } });
        if (info) {
             try {
                 info.root = JSON.parse(info.root);
             } catch (e) {
                 info.root = [];
             }
             try {
                 info.auth = JSON.parse(info.auth);
             } catch (e) {
                 info.auth = {};
             }
             return { state: 'success', info };
        }
        return { state: 'error', info: '数据不存在!' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
    const { id } = body;
    if (id) {
        // Check relations
        const user = await this.prisma.user.findFirst({ where: { role: Number(id) } });
        if (user) return { state: 'error', info: '存在数据关联,删除失败!' };

        await this.prisma.role.delete({ where: { id: Number(id) } });
        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
