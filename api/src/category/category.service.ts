import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async record() {
    const list = await this.prisma.category.findMany({
      orderBy: { sort: 'asc' }
    });
    const tree = this.hTree(list);
    return { state: 'success', info: tree };
  }

  async save(body: any) {
    const { id, pid, name, sort, data } = body;
    if (name) {
      if (id) {
        // Validation: cannot be own child
        if (Number(pid) === Number(id)) {
            return { state: 'error', info: '所属类别选择不正确!' };
        }
        // Check if pid is a child of id (circular reference check)
        // In PHP: in_array($input['pid'],findTreeArr('category',$input['id'],'id'))
        // findTreeArr gets all descendant IDs.
        
        const all = await this.prisma.category.findMany();
        const childrenIds = this.getTreeIds(all, Number(id));
        
        if (childrenIds.includes(Number(pid))) {
             return { state: 'error', info: '所属类别选择不正确!' };
        }

        await this.prisma.category.update({
          where: { id: Number(id) },
          data: {
            pid: Number(pid),
            name,
            sort: sort ? Number(sort) : 0,
            data: data || ''
          }
        });
      } else {
        await this.prisma.category.create({
          data: {
            pid: Number(pid),
            name,
            sort: sort ? Number(sort) : 0,
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
      const info = await this.prisma.category.findUnique({ where: { id: Number(id) } });
      return { state: 'success', info };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
    const { id } = body;
    if (id) {
      // Check for children
      const children = await this.prisma.category.findFirst({ where: { pid: Number(id) } });
      if (children) {
        return { state: 'error', info: '存在子数据,删除失败!' };
      }
      // Check for goods association
      const goods = await this.prisma.goods.findFirst({ where: { category: Number(id) } });
      if (goods) {
        return { state: 'error', info: '存在数据关联,删除失败!' };
      }

      await this.prisma.category.delete({ where: { id: Number(id) } });
      return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  // Recursive tree builder
  private hTree(data: any[], pid = 0) {
    const tree: any[] = [];
    data.forEach((item) => {
      if (item.pid === pid) {
        const children = this.hTree(data, item.id);
        const node = { ...item, sub: children };
        tree.push(node);
      }
    });
    return tree;
  }

  // Get all descendant IDs
  private getTreeIds(data: any[], pid: number): number[] {
    let ids: number[] = [];
    data.forEach((item) => {
      if (item.pid === pid) {
        ids.push(item.id);
        ids = ids.concat(this.getTreeIds(data, item.id));
      }
    });
    return ids;
  }
}
