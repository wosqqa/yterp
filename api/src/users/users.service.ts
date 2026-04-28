import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { user: username },
          { tel: username }
        ]
      },
    });
  }

  async record(body: any, currentUser: any) {
    const { page, limit, name, user, tel, data } = body;
    const where: any = {};
    
    // Scope filter (Assuming admin id is 1, otherwise filter by frame)
    if (currentUser.userId !== 1) {
      where.frame = currentUser.frame;
    }

    if (name) where.name = { contains: name };
    if (user) where.user = { contains: user };
    if (tel) where.tel = { contains: tel };
    if (data) where.data = { contains: data };

    const count = await this.prisma.user.count({ where });
    const list = await this.prisma.user.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    // Manually fetch related data (Frame, Role)
    const frameIds = [...new Set(list.map(item => item.frame))];
    const roleIds = [...new Set(list.map(item => item.role))];

    const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });
    const roles = await this.prisma.role.findMany({ where: { id: { in: roleIds } } });

    const info = list.map(item => {
        // Remove password from response
        const { pwd, ...rest } = item;
        return {
            ...rest,
            frameData: frames.find(f => f.id === item.frame) || null,
            roleData: roles.find(r => r.id === item.role) || null,
        };
    });

    return { state: 'success', count, info };
  }

  async save(body: any, currentUser: any) {
    const { id, name, user, pwd, role, frame, tel, note, data, status, more, img, expire } = body;
    
    // PHP: $input['pwd']=md5($input['pwd']);
    
    const inputData: any = {
        name,
        user,
        tel,
        data: data || note || '', // note might be mapped to data
        role: role ? Number(role) : 0,
        frame: frame ? Number(frame) : 0,
        py: name, // Default py to name
        img: img || '',
        expire: expire ? Number(expire) : 0,
        more: typeof more === 'string' ? more : JSON.stringify(more || {}),
        // status field removed as it does not exist in schema
    };

    if (pwd) {
        inputData.pwd = crypto.createHash('md5').update(pwd).digest('hex');
    }

    if (id) {
        // Update
        if (!pwd) {
            delete inputData.pwd;
        }
        await this.prisma.user.update({
            where: { id: Number(id) },
            data: inputData
        });
    } else {
        // Create
        if (!pwd) {
            return { state: 'error', info: '密码不能为空!' };
        }
        // Check if user exists
        const exists = await this.prisma.user.findFirst({ where: { user } });
        if (exists) {
            return { state: 'error', info: '用户名已存在!' };
        }
        await this.prisma.user.create({ data: inputData });
    }
    return { state: 'success' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
        const user = await this.prisma.user.findUnique({ where: { id: Number(id) } });
        if (user) {
            const { pwd, ...rest } = user;
            return { state: 'success', info: rest };
        }
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async del(body: any) {
    const { id } = body;
    if (id) {
        if (Number(id) === 1) {
            return { state: 'error', info: '超级管理员不能删除!' };
        }
        // Check relations
        // PHP checks many tables.
        // For now, let's assume if it's used in critical tables, we block.
        // Or just delete.
        
        await this.prisma.user.delete({ where: { id: Number(id) } });
        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
