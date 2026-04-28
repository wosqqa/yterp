import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit, number, customer, people, startTime, endTime, examine, nucleus, cse, invoice, check, data, goods } = body;
    const where: any = {};

    // Scope filter
    if (user.userId !== 1) {
      where.frame = user.frame;
    }

    // Build query conditions
    if (number) where.number = { contains: number };
    if (customer) where.customer = Number(customer);
    if (people) where.people = Number(people);
    if (examine !== undefined && examine !== '') where.examine = Number(examine);
    if (nucleus !== undefined && nucleus !== '') where.nucleus = Number(nucleus);
    if (cse !== undefined && cse !== '') where.cse = Number(cse);
    if (invoice !== undefined && invoice !== '') where.invoice = Number(invoice);
    if (check !== undefined && check !== '') where.check = Number(check);
    if (data) where.data = { contains: data };
    
    if (startTime || endTime) {
        where.time = {};
        if (startTime) {
            const start = Number(startTime);
            if (!isNaN(start)) where.time.gte = start;
        }
        if (endTime) {
            const end = Number(endTime);
            if (!isNaN(end)) where.time.lte = end;
        }
        if (Object.keys(where.time).length === 0) {
            delete where.time;
        }
    }

    // Goods filter (extended query)
    if (goods) {
        const goodsList = await this.prisma.goods.findMany({
            where: {
                OR: [
                    { name: { contains: goods } },
                    { py: { contains: goods } }
                ]
            },
            select: { id: true }
        });
        const goodsIds = goodsList.map(g => g.id);
        
        const sellInfos = await this.prisma.sellInfo.findMany({
            where: { goods: { in: goodsIds } },
            select: { pid: true }
        });
        const sellIds = sellInfos.map(info => info.pid);
        
        where.id = { in: sellIds };
    }

    const count = await this.prisma.sell.count({ where });
    const list = await this.prisma.sell.findMany({
      where,
      skip: (Number(page || 1) - 1) * Number(limit || 10),
      take: Number(limit || 10),
      orderBy: [{ time: 'desc' }, { id: 'desc' }],
    });

    // Fetch relations manually
    const customerIds = [...new Set(list.map(item => item.customer))].filter((id): id is number => id !== null);
    const peopleIds = [...new Set(list.map(item => item.people))].filter((id): id is number => id !== null);
    const userIds = [...new Set(list.map(item => item.user))].filter((id): id is number => id !== null);
    const frameIds = [...new Set(list.map(item => item.frame))].filter((id): id is number => id !== null);

    const customers = await this.prisma.customer.findMany({ where: { id: { in: customerIds } } });
    const peoples = await this.prisma.people.findMany({ where: { id: { in: peopleIds } } });
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
    const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });

    // Fetch related docs (sor, sre)
    const sorIds = [...new Set(list.map(item => item.source).filter((id): id is number => id !== null && id > 0))];
    const sreSources = list.map(item => item.id);
    
    const sors = sorIds.length > 0 ? await this.prisma.sor.findMany({ where: { id: { in: sorIds } } }) : [];
    const sres = await this.prisma.sre.findMany({ where: { source: { in: sreSources } } });

    const info = list.map(item => {
        const customerData = customers.find(s => s.id === item.customer) || null;
        const peopleData = peoples.find(p => p.id === item.people) || null;
        const userData = users.find(u => u.id === item.user) || null;
        const frameData = frames.find(f => f.id === item.frame) || null;
        
        // Relations
        const relation: { type: string; time: string; number: string; sort: number; types: string; id: number; }[] = [];
        // Sales Order (sor)
        if (item.source) {
            const sor = sors.find(s => s.id === item.source);
            if (sor) {
                relation.push({
                    type: '销售订单',
                    time: new Date(sor.time * 1000).toISOString().split('T')[0],
                    number: sor.number,
                    sort: sor.time,
                    types: 'sor',
                    id: sor.id
                });
            }
        }
        // Sales Return (sre)
        const relatedSres = sres.filter(b => b.source === item.id);
        relatedSres.forEach(b => {
             relation.push({
                type: '销售退货单',
                time: new Date(b.time * 1000).toISOString().split('T')[0],
                number: b.number,
                sort: b.time,
                types: 'sre',
                id: b.id
            });
        });
        
        relation.sort((a, b) => b.sort - a.sort);

        return {
            ...item,
            customerData,
            peopleData,
            userData,
            frameData,
            relation,
            extension: {
                // Add extension fields if needed
            }
        };
    });

    return { state: 'success', count, info };
  }

  async save(body: any, user: any) {
    return { state: 'error', info: 'Not implemented' };
  }
  
  async get(body: any) {
    return { state: 'error', info: 'Not implemented' };
  }

  async del(body: any) {
    return { state: 'error', info: 'Not implemented' };
  }

  async check(body: any) {
    return { state: 'error', info: 'Not implemented' };
  }

  async examine(body: any) {
    return { state: 'error', info: 'Not implemented' };
  }
}
