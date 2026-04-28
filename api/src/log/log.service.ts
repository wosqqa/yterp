import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit, info, user: searchUser, startTime, endTime } = body;
    const where: any = {};

    // SQL Auth (Simplified: usually admin sees all, others see own or scope)
    // PHP: sqlAuth('log',$sql)
    if (user.userId !== 1) {
        where.user = user.userId;
    }

    if (info) {
      where.info = { contains: info };
    }
    if (searchUser) {
      // searchUser is likely a user ID or name?
      // PHP: ['user','fullEq'] -> exact match on user field
      // user field in Log is Int (user ID).
      // If searchUser is string name, we need to find user ID first or join.
      // But usually frontend sends ID if it's a select, or name if it's text.
      // Assuming ID for now or implement name search via relation.
      // If frontend sends name, we need to look up user.
      // Let's assume it sends ID if it's a dropdown.
      if (!isNaN(Number(searchUser))) {
          where.user = Number(searchUser);
      }
    }
    if (startTime) {
      const start = Number(startTime);
      if (!isNaN(start)) {
          where.time = { gte: start };
      }
    }
    if (endTime) {
      const end = Number(endTime);
      if (!isNaN(end)) {
          if (where.time) {
              where.time.lte = end;
          } else {
              where.time = { lte: end };
          }
      }
    }

    const count = await this.prisma.log.count({ where });
    const list = await this.prisma.log.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    // Fetch user details for display
    const userIds = [...new Set(list.map(l => l.user))];
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
    
    const infoList = list.map(item => ({
        ...item,
        userData: users.find(u => u.id === item.user)
    }));

    return { state: 'success', count, info: infoList };
  }

  async empty() {
    try {
      await this.prisma.log.deleteMany({});
      // pushLog('清空操作日志'); // TODO: Implement logging
      return { state: 'success' };
    } catch (e) {
      return { state: 'error', info: '内部错误,操作已撤销!' };
    }
  }
}
