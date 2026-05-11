import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class MrtService {
  constructor(private prisma: PrismaService) {}

  async mpt(body: any, user: any) {
    try {
      const { page, limit, customer, number, startTime, endTime, user: userId, people, mold, type } = body;
      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

    const molds: string[] = Array.isArray(mold) && mold.length > 0 ? mold : ['sell', 'sre'];

    const timeWhere: any = {};
    if (startTime) timeWhere.gte = dayjs(startTime).startOf('day').unix();
    if (endTime) timeWhere.lte = dayjs(endTime).endOf('day').unix();

    const baseWhere: any = {
      ...(Object.keys(timeWhere).length > 0 ? { time: timeWhere } : {}),
    };
    if (customer) baseWhere.customer = Number(customer);
    if (number) baseWhere.number = { contains: String(number) };
    if (userId) baseWhere.user = Number(userId);
    if (people) baseWhere.people = Number(people);
    if (user && user.role !== 0 && user.frame) baseWhere.frame = Number(user.frame);

    const list: any[] = [];

    if (molds.includes('sell')) {
      const rows = await this.prisma.sell.findMany({
        where: { ...baseWhere, examine: 1 },
        orderBy: [{ time: 'desc' }, { id: 'desc' }],
      });
      rows.forEach((r: any) => list.push({ mold: 'sell', bill: '销售单', row: r, sort: Number(r.time) }));
    }

    if (molds.includes('sre')) {
      const rows = await (this.prisma as any).sre.findMany({
        where: { ...baseWhere, examine: true },
        orderBy: [{ time: 'desc' }, { id: 'desc' }],
      });
      rows.forEach((r: any) => list.push({ mold: 'sre', bill: '销售退货单', row: r, sort: Number(r.time) }));
    }

    list.sort((a, b) => {
      if (b.sort !== a.sort) return b.sort - a.sort;
      const bid = Number(b.row?.id) || 0;
      const aid = Number(a.row?.id) || 0;
      return bid - aid;
    });
    const count = list.length;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const paged = list.slice(skip, skip + take);

    const allSellIds = [...new Set(list.filter((x) => x.mold === 'sell').map((x) => Number(x.row.id)).filter((v) => v))];
    const allSreIds = [...new Set(list.filter((x) => x.mold === 'sre').map((x) => Number(x.row.id)).filter((v) => v))];

    const [sellActGroup, sreActGroup] = await Promise.all([
      allSellIds.length > 0
        ? this.prisma.summary.groupBy({
            by: ['class'],
            where: { type: 'sell', class: { in: allSellIds } },
            _sum: { bct: true },
          })
        : Promise.resolve([]),
      allSreIds.length > 0
        ? this.prisma.summary.groupBy({
            by: ['class'],
            where: { type: 'sre', class: { in: allSreIds } },
            _sum: { bct: true },
          })
        : Promise.resolve([]),
    ]);

    const sellActMap = new Map<number, number>((sellActGroup as any[]).map((x) => [Number(x.class), Number(x._sum?.bct || 0)]));
    const sreActMap = new Map<number, number>((sreActGroup as any[]).map((x) => [Number(x.class), Number(x._sum?.bct || 0)]));

    let sumSales = 0;
    let sumAct = 0;
    let sumFee = 0;
    for (const x of list) {
      const row = x.row;
      const sign = x.mold === 'sre' ? -1 : 1;
      const id = Number(row.id);
      const actual = Number(row.actual) * sign;
      const fee = Number(row.cost) * sign;
      const actBase = x.mold === 'sre' ? sreActMap.get(id) || 0 : sellActMap.get(id) || 0;
      const act = actBase * sign;
      sumSales += actual;
      sumFee += fee;
      sumAct += act;
    }
    const sumProfit = sumSales - sumAct - sumFee;
    const sumRate = sumSales === 0 ? 0 : (sumProfit / sumSales) * 100;

    const frameIds = [...new Set(paged.map((x) => Number(x.row.frame)).filter((v) => v || v === 0))];
    const customerIds = [...new Set(paged.map((x) => Number(x.row.customer)).filter((v) => v))];
    const userIds = [...new Set(paged.map((x) => Number(x.row.user)).filter((v) => v))];
    const peopleIds = [...new Set(paged.map((x) => Number(x.row.people)).filter((v) => v))];

    const frames = frameIds.length > 0 ? await this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : [];
    const customers =
      customerIds.length > 0 ? await this.prisma.customer.findMany({ where: { id: { in: customerIds } } }) : [];
    const users = userIds.length > 0 ? await this.prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
    const peoples = peopleIds.length > 0 ? await this.prisma.people.findMany({ where: { id: { in: peopleIds } } }) : [];

    const detailMode = Number(type || 0) === 1;

    const docIdsByMold = {
      sell: paged.filter((x) => x.mold === 'sell').map((x) => Number(x.row.id)),
      sre: paged.filter((x) => x.mold === 'sre').map((x) => Number(x.row.id)),
    };

    const sellInfos = detailMode && docIdsByMold.sell.length > 0
      ? await (this.prisma as any).sellInfo.findMany({
          where: { pid: { in: docIdsByMold.sell } },
          select: { id: true, pid: true, goods: true, attr: true, unit: true, price: true, nums: true, dsc: true, total: true, tat: true, tpt: true },
        })
      : [];
    const sreInfos = detailMode && docIdsByMold.sre.length > 0
      ? await (this.prisma as any).sreInfo.findMany({
          where: { pid: { in: docIdsByMold.sre } },
          select: { id: true, pid: true, goods: true, attr: true, unit: true, price: true, nums: true, dsc: true, total: true, tat: true, tpt: true },
        })
      : [];

    const goodsIdList = detailMode
      ? [...new Set([...sellInfos, ...sreInfos].map((i: any) => Number(i.goods)).filter((v) => v))]
      : [];
    const goodsList = goodsIdList.length > 0 ? await this.prisma.goods.findMany({ where: { id: { in: goodsIdList } } }) : [];

    const [sellInfoActGroup, sreInfoActGroup] = await Promise.all([
      detailMode && (sellInfos as any[]).length > 0
        ? this.prisma.summary.groupBy({
            by: ['info'],
            where: { type: 'sell', info: { in: [...new Set((sellInfos as any[]).map((x) => Number(x.id)).filter((v) => v))] } },
            _sum: { bct: true },
          })
        : Promise.resolve([]),
      detailMode && (sreInfos as any[]).length > 0
        ? this.prisma.summary.groupBy({
            by: ['info'],
            where: { type: 'sre', info: { in: [...new Set((sreInfos as any[]).map((x) => Number(x.id)).filter((v) => v))] } },
            _sum: { bct: true },
          })
        : Promise.resolve([]),
    ]);
    const sellInfoActMap = new Map<number, number>((sellInfoActGroup as any[]).map((x) => [Number(x.info), Number(x._sum?.bct || 0)]));
    const sreInfoActMap = new Map<number, number>((sreInfoActGroup as any[]).map((x) => [Number(x.info), Number(x._sum?.bct || 0)]));

    const toPercent = (numerator: number, denominator: number, isReturn: boolean) => {
      if (denominator === 0) return `${numerator === 0 ? 0 : -100}%`;
      const rate = (numerator / denominator) * 100;
      const out = isReturn ? -Math.abs(rate) : rate;
      return `${out.toFixed(2)}%`;
    };

    const info = paged.map((x) => {
      const row = x.row;
      const sign = x.mold === 'sre' ? -1 : 1;
      const total = Number(row.total) * sign;
      const actual = Number(row.actual) * sign;
      const cost = Number(row.cost) * sign;
      const money = Number(row.money) * sign;
      const discount = Number((total - actual).toFixed(4));
      const actBase = x.mold === 'sre' ? sreActMap.get(Number(row.id)) || 0 : sellActMap.get(Number(row.id)) || 0;
      const act = Number((actBase * sign).toFixed(4));
      const gpt = Number((actual - act).toFixed(4));
      const npt = Number((gpt - cost).toFixed(4));
      const gpr = toPercent(gpt, actual, x.mold === 'sre');
      const npr = toPercent(npt, actual, x.mold === 'sre');
      const nucleusState = money === 0 ? '未核销' : Math.abs(money) >= Math.abs(actual) ? '已核销' : '部分核销';

      const base: any = {
        key: `${x.mold}_${row.id}`,
        bill: x.bill,
        frameData: frames.find((f) => f.id === Number(row.frame)) || null,
        customerData: customers.find((c) => c.id === Number(row.customer)) || null,
        userData: users.find((u) => u.id === Number(row.user)) || null,
        peopleData: peoples.find((p) => p.id === Number(row.people)) || null,
        time: dayjs.unix(Number(row.time)).format('YYYY-MM-DD'),
        number: row.number,
        total,
        discount,
        actual,
        act,
        gpt,
        gpr,
        cost,
        npt,
        npr,
        data: row.data || '',
        extension: {
          amount: money,
          nucleus: nucleusState,
        },
      };

      if (detailMode) {
        const details = (x.mold === 'sell' ? sellInfos : sreInfos).filter((i: any) => Number(i.pid) === Number(row.id));
        base.node = details.map((d: any, idx: number) => {
          const goodsData = goodsList.find((g) => g.id === Number(d.goods)) || null;
          const dtpt = Number(d.tpt) * sign;
          const dtotal = Number(d.total) * sign;
          const dtat = Number(d.tat) * sign;
          const ddsc = Number(d.dsc) * sign;
          const dnums = Number(d.nums) * sign;
          const dprice = Number(d.price) * sign;
          const dactBase = x.mold === 'sre' ? sreInfoActMap.get(Number(d.id)) || 0 : sellInfoActMap.get(Number(d.id)) || 0;
          const dact = goodsData && (goodsData as any).type ? 0 : Number((dactBase * sign).toFixed(4));
          const dgpt = Number((dtpt - dact).toFixed(4));
          const dgpr = toPercent(dgpt, dtpt, x.mold === 'sre');
          return {
            key: `${base.key}_${idx}`,
            bill: '',
            frameData: base.frameData,
            customerData: base.customerData,
            time: base.time,
            number: base.number,
            total: '',
            discount: '',
            actual: '',
            act: dact,
            gpt: dgpt,
            gpr: dgpr,
            cost: '',
            npt: '',
            npr: '',
            data: base.data,
            extension: base.extension,
            detail: {
              name: goodsData?.name || '',
              attr: d.attr || '',
              unit: d.unit || '',
              price: dprice,
              nums: dnums,
              dsc: ddsc,
              total: dtotal,
              tat: dtat,
              tpt: dtpt,
              act: dact,
              gpt: dgpt,
              gpr: dgpr,
            },
          };
        });
      }

      return base;
    });

      return {
        state: 'success',
        count,
        info,
        sum: {
          sales: Number(sumSales.toFixed(4)),
          profit: Number(sumProfit.toFixed(4)),
          rate: `${sumRate.toFixed(2)}%`,
        },
      };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }

  async mot(body: any, user: any) {
    try {
      const { page, limit, name, number, startTime, endTime } = body;
      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

    const goodsWhere: any = {};
    if (name) goodsWhere.OR = [{ name: { contains: String(name) } }, { py: { contains: String(name) } }];
    if (number) goodsWhere.number = { contains: String(number) };
    const goodsList = await this.prisma.goods.findMany({ where: goodsWhere, select: { id: true, name: true, number: true, spec: true, unit: true } });
    const goodsIds = goodsList.map((g) => g.id);
    if (goodsIds.length === 0) return { state: 'success', count: 0, info: [] };

    const timeWhere: any = {};
    if (startTime) timeWhere.gte = dayjs(startTime).startOf('day').unix();
    if (endTime) timeWhere.lte = dayjs(endTime).endOf('day').unix();

    const classWhere: any = { ...(Object.keys(timeWhere).length > 0 ? { time: timeWhere } : {}) };
    if (user && user.role !== 0 && user.frame) classWhere.frame = Number(user.frame);

    const sellClass = await this.prisma.sell.findMany({ where: { ...classWhere, examine: 1 }, select: { id: true } });
    const sreClass = await (this.prisma as any).sre.findMany({ where: { ...classWhere, examine: true }, select: { id: true } });
    const sellIds = sellClass.map((c: any) => c.id);
    const sreIds = sreClass.map((c: any) => c.id);

    const sellInfo = sellIds.length > 0
      ? await (this.prisma as any).sellInfo.findMany({
          where: { pid: { in: sellIds }, goods: { in: goodsIds } },
          select: { goods: true, attr: true, unit: true, nums: true, dsc: true, tat: true, tpt: true },
        })
      : [];
    const sreInfo = sreIds.length > 0
      ? await (this.prisma as any).sreInfo.findMany({
          where: { pid: { in: sreIds }, goods: { in: goodsIds } },
          select: { goods: true, attr: true, unit: true, nums: true, dsc: true, tat: true, tpt: true },
        })
      : [];

    const groups = new Map<string, any>();
    const apply = (mold: 'sell' | 'sre', row: any) => {
      const key = `${row.goods}_${row.attr || ''}_${row.unit || ''}`;
      if (!groups.has(key)) {
        groups.set(key, {
          goods: Number(row.goods),
          attr: row.attr || '',
          unit: row.unit || '',
          sell: { nums: 0, dsc: 0, tat: 0, tpt: 0 },
          sre: { nums: 0, dsc: 0, tat: 0, tpt: 0 },
        });
      }
      const g = groups.get(key);
      g[mold].nums += Number(row.nums);
      g[mold].dsc += Number(row.dsc);
      g[mold].tat += Number(row.tat);
      g[mold].tpt += Number(row.tpt);
    };
    sellInfo.forEach((r: any) => apply('sell', r));
    sreInfo.forEach((r: any) => apply('sre', r));

    const rows = Array.from(groups.values()).map((g) => {
      const nums = Number((g.sell.nums - g.sre.nums).toFixed(4));
      const dsc = Number((g.sell.dsc - g.sre.dsc).toFixed(4));
      const tat = Number((g.sell.tat - g.sre.tat).toFixed(4));
      const tpt = Number((g.sell.tpt - g.sre.tpt).toFixed(4));
      const total = Number((tpt - tat).toFixed(4));
      const bct = 0;
      const uct = nums === 0 ? 0 : Number((bct / nums).toFixed(4));
      const gpt = Number((total - bct).toFixed(4));
      const gpr = total === 0 ? 0 : Number((gpt / total).toFixed(4));
      return {
        goodsData: goodsList.find((x) => x.id === g.goods) || null,
        attr: g.attr,
        unit: g.unit,
        nums,
        dsc,
        tat,
        tpt,
        uct,
        bct,
        gpt,
        gpr,
      };
    });

    rows.sort((a, b) => b.nums - a.nums);
    const count = rows.length;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const info = rows.slice(skip, skip + take);

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }
}
