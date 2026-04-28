import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SwapService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const {
      page,
      limit,
      number,
      people,
      startTime,
      endTime,
      examine,
      cse,
      user: searchUser,
      data,
      goods,
    } = body || {};

    if (page === undefined || limit === undefined) {
      return { state: 'error', info: '传入参数不完整!' };
    }

    const where: any = {};

    if (number) where.number = { contains: String(number) };
    if (people) where.people = Number(people);
    if (examine !== undefined && examine !== '') where.examine = Boolean(Number(examine));
    if (cse !== undefined && cse !== '') where.cse = Number(cse);
    if (searchUser) where.user = Number(searchUser);
    if (data) where.data = { contains: String(data) };

    if (startTime || endTime) {
      where.time = {};
      if (startTime) where.time.gte = typeof startTime === 'string' && startTime.includes('-') ? Math.floor(new Date(startTime).getTime() / 1000) : Number(startTime);
      if (endTime) where.time.lte = typeof endTime === 'string' && endTime.includes('-') ? Math.floor(new Date(endTime).getTime() / 1000) : Number(endTime);
    }

    if (goods) {
      const goodsRows = await this.prisma.goods.findMany({
        where: { OR: [{ name: { contains: String(goods) } }, { py: { contains: String(goods) } }] },
        select: { id: true },
      });
      const goodsIds = goodsRows.map((g) => g.id);
      if (goodsIds.length > 0) {
        const swapInfoRows = await this.prisma.swapInfo.findMany({
          where: { goods: { in: goodsIds } },
          select: { pid: true },
        });
        const pids = [...new Set(swapInfoRows.map((r) => r.pid))];
        if (pids.length > 0) where.id = { in: pids };
        else return { state: 'success', count: 0, info: [] };
      } else {
        return { state: 'success', count: 0, info: [] };
      }
    }

    if (user.userId !== 1) where.frame = user.frame;

    const total = await this.prisma.swap.count({ where });
    const list = await this.prisma.swap.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    const ids = list.map((v) => v.id);
    const frameIds = [...new Set(list.map((v) => v.frame))];
    const peopleIds = [...new Set(list.map((v) => v.people).filter((v) => v))];
    const userIds = [...new Set(list.map((v) => v.user))];

    const [frames, peoples, users, costs, records] = await Promise.all([
      frameIds.length ? this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : Promise.resolve([] as any[]),
      peopleIds.length ? this.prisma.people.findMany({ where: { id: { in: peopleIds as number[] } } }) : Promise.resolve([] as any[]),
      userIds.length ? this.prisma.user.findMany({ where: { id: { in: userIds } } }) : Promise.resolve([] as any[]),
      ids.length ? this.prisma.cost.findMany({ where: { type: 'swap', class: { in: ids } } }) : Promise.resolve([] as any[]),
      ids.length ? this.prisma.record.findMany({ where: { type: 'swap', source: { in: ids } } }) : Promise.resolve([] as any[]),
    ]);

    const frameMap = new Map<number, any>(frames.map((v) => [v.id, v]));
    const peopleMap = new Map<number, any>(peoples.map((v) => [v.id, v]));
    const userMap = new Map<number, any>(users.map((v) => [v.id, v]));

    const costMap = new Map<number, any[]>();
    costs.forEach((c: any) => {
        if (!costMap.has(c.class)) costMap.set(c.class, []);
        costMap.get(c.class)!.push(c);
    });
    const recordMap = new Map<number, any[]>();
    records.forEach((r: any) => {
        if (!recordMap.has(r.source)) recordMap.set(r.source, []);
        recordMap.get(r.source)!.push(r);
    });

    const info = list.map(item => {
        let logisticsObj = null;
        try { logisticsObj = item.logistics ? JSON.parse(item.logistics) : null; } catch {}
        let fileObj = [];
        try { fileObj = item.file ? JSON.parse(item.file) : []; } catch {}
        let moreObj = {};
        try { moreObj = item.more ? JSON.parse(item.more) : {}; } catch {}

        return {
            ...item,
            time: new Date(item.time * 1000).toISOString().slice(0, 10),
            total: Number(item.total),
            cost: Number(item.cost),
            logistics: logisticsObj,
            file: fileObj,
            more: moreObj,
            frameData: frameMap.get(item.frame),
            peopleData: peopleMap.get(item.people || 0),
            userData: userMap.get(item.user),
            costData: costMap.get(item.id) || [],
            recordData: recordMap.get(item.id) || [],
            extension: {
                type: '调拨单',
                examine: item.examine ? '已审核' : '未审核',
                cse: ['未结算', '部分结算', '已结算', '无需结算'][item.cse || 0] || '',
            }
        };
    });

    return { state: 'success', count: total, info };
  }

  async save(body: any, user: any) {
    const dataSource = body.class ? body.class : body;
    const listSource = body.info ? body.info : body.list;
    const costSource = body.cost ? body.cost : [];

    const { id, people, time, number, data, logistics, file, more, examine, warehouseOut, warehouseIn } = dataSource;

    if (!listSource || listSource.length === 0) return { state: 'error', info: '请选择商品!' };
    if (!warehouseOut || !warehouseIn) return { state: 'error', info: '请选择调出仓库和调入仓库!' };
    if (warehouseOut == warehouseIn) return { state: 'error', info: '调出仓库和调入仓库不能相同!' };

    let timeVal = Math.floor(Date.now() / 1000);
    if (time) {
       timeVal = typeof time === 'string' && time.includes('-') ? Math.floor(new Date(time).getTime() / 1000) : Number(time);
    }

    const swapData: any = {
      frame: user.frame || 1,
      time: timeVal,
      people: people ? Number(people) : 0,
      logistics: logistics ? (typeof logistics === 'object' ? JSON.stringify(logistics) : String(logistics)) : '',
      file: file ? (typeof file === 'object' ? JSON.stringify(file) : String(file)) : '',
      data: data || '',
      more: more ? (typeof more === 'object' ? JSON.stringify(more) : String(more)) : '',
      examine: !!examine,
      cse: (costSource && costSource.length > 0) ? 0 : 3,
      user: user.userId || 1,
      number: number || '',
      total: 0,
      cost: 0,
    };

    let totalAmount = 0;
    listSource.forEach((item: any) => {
        totalAmount += Number(item.total || 0);
    });
    swapData.total = totalAmount;

    let totalCost = 0;
    costSource.forEach((item: any) => {
        totalCost += Number(item.money || 0);
    });
    swapData.cost = totalCost;

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        let swapId = id ? Number(id) : 0;
        
        if (swapId === 0) {
           if (!swapData.number) {
               swapData.number = 'DB' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + Math.floor(Math.random() * 10000);
           }
           const newSwap = await prisma.swap.create({ data: swapData });
           swapId = newSwap.id;
           
           await prisma.log.create({
               data: {
                   time: Math.floor(Date.now() / 1000),
                   user: user.userId || 1,
                   info: `新增调拨单[ ${swapData.number} ]`
               }
           });
        } else {
           await prisma.swap.update({ where: { id: swapId }, data: swapData });
           await prisma.log.create({
               data: {
                   time: Math.floor(Date.now() / 1000),
                   user: user.userId || 1,
                   info: `更新调拨单[ ${swapData.number} ]`
               }
           });
        }

        await prisma.swapInfo.deleteMany({ where: { pid: swapId } });
        const infoData = listSource.map((item: any) => ({
            pid: swapId,
            goods: Number(item.goods),
            attr: item.attr || '',
            unit: item.unit || '',
            warehouse: Number(warehouseOut),
            storehouse: Number(warehouseIn),
            batch: item.batch || '',
            mfd: item.mfd ? (typeof item.mfd === 'string' && item.mfd.includes('-') ? Math.floor(new Date(item.mfd).getTime() / 1000) : Number(item.mfd)) : 0,
            price: Number(item.price),
            nums: Number(item.nums),
            serial: item.serial ? (typeof item.serial === 'object' ? JSON.stringify(item.serial) : String(item.serial)) : '',
            total: Number(item.total),
            data: item.data || '',
        }));
        if (infoData.length > 0) await prisma.swapInfo.createMany({ data: infoData });

        await prisma.cost.deleteMany({ where: { type: 'swap', class: swapId } });
        if (costSource.length > 0) {
            const costData = costSource.map((item: any) => ({
                type: 'swap',
                class: swapId,
                iet: Number(item.iet),
                time: timeVal,
                money: Number(item.money),
                settle: 0,
                state: 0,
                data: item.data || '',
            }));
            await prisma.cost.createMany({ data: costData });
        }

        return swapId;
      });
      return { state: 'success', info: result };
    } catch (error) {
        console.error(error);
        return { state: 'error', info: '内部错误: ' + error.message };
    }
  }
}