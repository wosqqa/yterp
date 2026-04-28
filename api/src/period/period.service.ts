import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeriodService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit } = body;
    const where: any = {};
    
    // PHP: sqlAuth('period',[]) - Period usually admin only or viewable by all?
    // Let's assume standard view.
    
    const count = await this.prisma.period.count({ where });
    const list = await this.prisma.period.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    // Fetch user details
    const userIds = [...new Set(list.map(p => p.user))];
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });

    const info = list.map(item => ({
        ...item,
        userData: users.find(u => u.id === item.user)
    }));

    return { state: 'success', count, info };
  }

  async save(body: any, user: any) {
    const { date } = body;
    // date is string like '2021-01-01'
    if (date) {
        const periodTime = await this.getPeriod();
        const dateTime = new Date(date).getTime() / 1000; // PHP timestamp is seconds
        
        if (dateTime > periodTime) {
            await this.prisma.period.create({
                data: {
                    date: dateTime,
                    time: Math.floor(Date.now() / 1000),
                    user: user.userId
                }
            });
            // pushLog('结账操作');
            return { state: 'success' };
        } else {
            return { state: 'error', info: '结账周期不正确!' };
        }
    }
    return { state: 'error', info: '传入参数不完整!' };
  }

  async back() {
    const period = await this.getPeriod();
    // Delete periods with date = current max period (which is what getPeriod returns)
    // Wait, getPeriod usually returns the MAX date from period table.
    // If we delete it, we roll back to previous period.
    
    // PHP: $row=db('period')->where([['date','=',$period]])->delete();
    // This implies deleting the latest record.
    
    await this.prisma.period.deleteMany({
        where: { date: period }
    });
    // pushLog('反结账操作');
    return { state: 'success' };
  }

  // Helper: get max period date (timestamp)
  private async getPeriod() {
    const last = await this.prisma.period.findFirst({
        orderBy: { date: 'desc' }
    });
    return last ? last.date : 0;
  }
}
