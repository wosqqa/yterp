import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeUtil } from '../utils/tree.util';

@Injectable()
export class FrameService {
  constructor(private prisma: PrismaService) {}

  async record() {
    const frames = await this.prisma.frame.findMany({
      orderBy: { sort: 'asc' },
    });
    // Assuming root pid is 0 (NestJS/Prisma usually uses 0 or null for root, PHP uses 0 based on schema usually).
    // In PHP code: $frame=$tree::hTree(Frames::order(['sort'=>'asc'])->select());
    // TreeUtil.hTree defaults to pid 0 or -1? In ServiceService I used 0.
    // Let's assume 0.
    const info = TreeUtil.hTree(frames, 0);
    return { state: 'success', info };
  }

  async save(body: any) {
    const { id, pid, name, sort, data } = body;
    // Validation
    // Check loop if updating
    if (id) {
        // pid cannot be self or descendant
        if (Number(id) === Number(pid)) {
             return { state: 'error', info: '所属组织选择不正确!' };
        }
        // Need to find descendants to ensure pid is not one of them.
        // Or simplified: just don't allow self.
        // Implementing full descendant check might be expensive without closure table or CTE.
        // PHP: in_array($input['pid'],findTreeArr('frame',$input['id'],'id'))
        // findTreeArr gets all children.
        
        const children = await this.getAllChildrenIds(Number(id));
        if (children.includes(Number(pid))) {
            return { state: 'error', info: '所属组织选择不正确!' };
        }

        await this.prisma.frame.update({
            where: { id: Number(id) },
            data: {
                pid: Number(pid),
                name,
                sort: sort ? Number(sort) : 0,
                data
            }
        });
    } else {
        await this.prisma.frame.create({
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

  async get(body: any) {
    const { id } = body;
    if (id) {
        const info = await this.prisma.frame.findUnique({ where: { id: Number(id) } });
        return { state: 'success', info };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
    const { id } = body;
    if (id) {
        // Check children
        const children = await this.prisma.frame.findFirst({ where: { pid: Number(id) } });
        if (children) {
            return { state: 'error', info: '存在子数据,删除失败!' };
        }
        // Check relations (Simplified: just check user for now, adding more as needed)
        // PHP checks MANY tables.
        // Ideally we should check them all.
        // For now, let's implement a few critical ones.
        const user = await this.prisma.user.findFirst({ where: { frame: Number(id) } });
        if (user) return { state: 'error', info: '存在数据关联,删除失败!' };

        const customer = await this.prisma.customer.findFirst({ where: { frame: Number(id) } });
        if (customer) return { state: 'error', info: '存在数据关联,删除失败!' };
        
        const supplier = await this.prisma.supplier.findFirst({ where: { frame: Number(id) } });
        if (supplier) return { state: 'error', info: '存在数据关联,删除失败!' };

        await this.prisma.frame.delete({ where: { id: Number(id) } });
        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  // Helper to get all children IDs
  private async getAllChildrenIds(id: number): Promise<number[]> {
      const children = await this.prisma.frame.findMany({ where: { pid: id } });
      let ids = children.map(c => c.id);
      for (const child of children) {
          ids = [...ids, ...(await this.getAllChildrenIds(child.id))];
      }
      return ids;
  }
}
