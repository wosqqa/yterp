import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeUtil } from '../utils/tree.util';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async record() {
    const list = await this.prisma.menu.findMany({
      orderBy: { sort: 'asc' }
    });

    const info = list.map(item => ({
      ...item,
      extension: {
        model: item.model ? '新页模式' : '标签模式',
        type: item.type ? '附属菜单' : '独立菜单'
      }
    }));

    const tree = TreeUtil.hTree(info, 0);
    return { state: 'success', info: tree };
  }

  async save(body: any) {
    if (body.id !== undefined) {
      if (body.id === 0) {
        // Create
        await this.prisma.menu.create({
          data: {
            pid: Number(body.pid),
            name: body.name,
            key: body.key,
            model: Boolean(Number(body.model)),
            type: Boolean(Number(body.type)),
            resource: body.resource,
            sort: Number(body.sort) || 0,
            ico: body.ico,
            root: body.root,
            data: body.data || ''
          }
        });
      } else {
        // Update
        // Check if pid is in children (prevent cycle)
        const allMenus = await this.prisma.menu.findMany();
        const treeIds = TreeUtil.getTreeIds(allMenus, body.id);
        if (treeIds.includes(Number(body.pid))) {
          return { state: 'error', info: '所属菜单选择不正确!' };
        }

        await this.prisma.menu.update({
          where: { id: Number(body.id) },
          data: {
            pid: Number(body.pid),
            name: body.name,
            key: body.key,
            model: Boolean(Number(body.model)),
            type: Boolean(Number(body.type)),
            resource: body.resource,
            sort: Number(body.sort) || 0,
            ico: body.ico,
            root: body.root,
            data: body.data || ''
          }
        });
      }

      // Update parent menu resource if it's not a sub-menu
      if (Number(body.type) !== 1 && Number(body.pid) !== 0) {
        await this.prisma.menu.update({
          where: { id: Number(body.pid) },
          data: { resource: '#group' }
        });
      }

      return { state: 'success' };
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }

  async get(body: any) {
    if (body.id !== undefined) {
      const info = await this.prisma.menu.findUnique({
        where: { id: Number(body.id) }
      });
      return { state: 'success', info: info };
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }

  async del(body: any) {
    if (body.id !== undefined) {
      const subFind = await this.prisma.menu.findFirst({
        where: { pid: Number(body.id) }
      });

      if (!subFind) {
        await this.prisma.menu.delete({
          where: { id: Number(body.id) }
        });
        return { state: 'success' };
      } else {
        return { state: 'error', info: '存在子数据,删除失败!' };
      }
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }
}
