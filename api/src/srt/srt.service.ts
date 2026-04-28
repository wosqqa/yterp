import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class SrtService {
  constructor(private prisma: PrismaService) {}

  async stt(body: any, user: any) {
    try {
      const {
        page,
        limit,
        customer,
        goods,
        number,
        state,
        startTime,
        endTime,
        startArrival,
        endArrival,
        warehouse,
        type,
      } = body;
      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

      const timeWhere: any = {};
      if (startTime) timeWhere.gte = dayjs(startTime).startOf('day').unix();
      if (endTime) timeWhere.lte = dayjs(endTime).endOf('day').unix();

    const classWhere: any = {
      examine: true,
      ...(Object.keys(timeWhere).length > 0 ? { time: timeWhere } : {}),
    };
    if (customer) classWhere.customer = Number(customer);
    if (number) classWhere.number = { contains: String(number) };
    void startArrival;
    void endArrival;
    if (user && user.role !== 0 && user.frame) classWhere.frame = Number(user.frame);

    let goodsIds: number[] | null = null;
    if (goods) {
      const goodsList = await this.prisma.goods.findMany({
        where: { OR: [{ name: { contains: String(goods) } }, { py: { contains: String(goods) } }] },
        select: { id: true },
      });
      goodsIds = goodsList.map((g) => g.id);
    }

    const sorList = await this.prisma.sor.findMany({
      where: classWhere,
      select: { id: true, frame: true, customer: true, time: true, number: true, data: true },
      orderBy: { id: 'desc' },
    });
    const sorIds = sorList.map((s) => s.id);
    if (sorIds.length === 0) return { state: 'success', count: 0, info: [] };

    const infoWhere: any = { pid: { in: sorIds } };
    const warehouseIds: number[] = Array.isArray(warehouse) ? warehouse.map((v: any) => Number(v)).filter((v) => v) : [];
    if (warehouseIds.length > 0) infoWhere.warehouse = { in: warehouseIds };
    if (goodsIds) infoWhere.goods = { in: goodsIds.length > 0 ? goodsIds : [-1] };

    const sorInfoList = await this.prisma.sorInfo.findMany({
      where: infoWhere,
      select: {
        id: true,
        pid: true,
        goods: true,
        attr: true,
        unit: true,
        warehouse: true,
        nums: true,
        handle: true,
        tpt: true,
        data: true,
      },
    });

    const wantedStates: number[] = Array.isArray(state) ? state.map((v: any) => Number(v)) : [];
    const filtered = sorInfoList.filter((row) => {
      if (wantedStates.length === 0) return true;
      const nums = Number(row.nums);
      const handle = Number(row.handle);
      const s = handle === 0 ? 0 : handle >= nums ? 2 : 1;
      return wantedStates.includes(s);
    });

    const frameIds = [...new Set(sorList.map((s) => Number(s.frame)).filter((v) => v !== null && v !== undefined))];
    const customerIds = [...new Set(sorList.map((s) => Number(s.customer)).filter((v) => v))];
    const frames = frameIds.length > 0 ? await this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : [];
    const customers =
      customerIds.length > 0 ? await this.prisma.customer.findMany({ where: { id: { in: customerIds } } }) : [];

    const goodsIdList = [...new Set(filtered.map((r) => Number(r.goods)).filter((v) => v))];
    const warehouseIdList = [...new Set(filtered.map((r) => Number(r.warehouse)).filter((v) => v))];
    const goodsListData =
      goodsIdList.length > 0 ? await this.prisma.goods.findMany({ where: { id: { in: goodsIdList } } }) : [];
    const warehouseListData =
      warehouseIdList.length > 0 ? await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIdList } } }) : [];

    const classMap = new Map<number, any>(sorList.map((s) => [s.id, s]));

    const leafRows = filtered.map((row) => {
      const cls = classMap.get(row.pid);
      const frameData = cls ? frames.find((f) => f.id === Number(cls.frame)) || null : null;
      const customerData = cls ? customers.find((c) => c.id === Number(cls.customer)) || null : null;
      const goodsData = goodsListData.find((g) => g.id === Number(row.goods)) || null;
      const warehouseData = warehouseListData.find((w) => w.id === Number(row.warehouse)) || null;
      const nums = Number(row.nums);
      const handle = Number(row.handle);
      const money = Number(row.tpt);
      const price = nums === 0 ? 0 : Number((money / nums).toFixed(4));
      const nns = Number((nums - handle).toFixed(4));
      const nmy = Number((price * nns).toFixed(4));
      const st = handle === 0 ? '未入库' : handle >= nums ? '已入库' : '部分入库';
      return {
        key: `sor_${row.id}`,
        frameData,
        customerData,
        time: cls ? dayjs.unix(Number(cls.time)).format('YYYY-MM-DD') : '',
        number: cls ? cls.number : '',
        goodsData,
        attr: row.attr,
        warehouseData,
        unit: row.unit,
        price,
        nums,
        money,
        nns,
        nmy,
        arrival: '',
        data: row.data || cls?.data || '',
        extension: { state: st },
      };
    });

    const sortType = Number(type || 0);
    let resultRows: any[] = [];
    if (sortType === 1) {
      const groups = new Map<string, any>();
      leafRows.forEach((r) => {
        const gk = `${r.goodsData?.id || 0}_${r.attr || ''}_${r.warehouseData?.id || 0}`;
        if (!groups.has(gk)) {
          groups.set(gk, {
            key: `g_${gk}`,
            goodsData: r.goodsData,
            attr: r.attr,
            warehouseData: r.warehouseData,
            unit: r.unit,
            price: 0,
            nums: 0,
            money: 0,
            nns: 0,
            nmy: 0,
            extension: { state: '' },
            arrival: '',
            data: '',
            node: [],
          });
        }
        const g = groups.get(gk);
        g.nums = Number((g.nums + r.nums).toFixed(4));
        g.money = Number((g.money + r.money).toFixed(4));
        g.nns = Number((g.nns + r.nns).toFixed(4));
        g.nmy = Number((g.nmy + r.nmy).toFixed(4));
        g.node.push(r);
      });
      resultRows = Array.from(groups.values()).map((g) => {
        g.price = g.nums === 0 ? 0 : Number((g.money / g.nums).toFixed(4));
        return g;
      });
    } else {
      resultRows = leafRows;
    }

      const count = resultRows.length;
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);
      const info = resultRows.slice(skip, skip + take);

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }

  async ssy(body: any, user: any) {
    try {
      const { page, limit, goods, warehouse, customer, user: userId, people, startTime, endTime, type } = body;
      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

    const timeWhere: any = {};
    if (startTime) timeWhere.gte = dayjs(startTime).startOf('day').unix();
    if (endTime) timeWhere.lte = dayjs(endTime).endOf('day').unix();

    const baseClassWhere: any = {
      examine: true,
      ...(Object.keys(timeWhere).length > 0 ? { time: timeWhere } : {}),
    };
    if (customer) baseClassWhere.customer = Number(customer);
    if (userId) baseClassWhere.user = Number(userId);
    if (people) baseClassWhere.people = Number(people);
    if (user && user.role !== 0 && user.frame) baseClassWhere.frame = Number(user.frame);

    let goodsIds: number[] | null = null;
    if (goods) {
      const goodsList = await this.prisma.goods.findMany({
        where: { OR: [{ name: { contains: String(goods) } }, { py: { contains: String(goods) } }] },
        select: { id: true },
      });
      goodsIds = goodsList.map((g) => g.id);
    }

    const warehouseIds: number[] = Array.isArray(warehouse) ? warehouse.map((v: any) => Number(v)).filter((v) => v) : [];

    const sellClass = await this.prisma.sell.findMany({
      where: baseClassWhere,
      select: { id: true, customer: true, user: true, people: true },
    });
    const sreClass = await this.prisma.sre.findMany({
      where: baseClassWhere,
      select: { id: true, customer: true, user: true, people: true },
    });
    const sellIds = sellClass.map((c) => c.id);
    const sreIds = sreClass.map((c) => c.id);

    const sellInfo =
      sellIds.length > 0
        ? await (this.prisma as any).sellInfo.findMany({
            where: {
              pid: { in: sellIds },
              ...(warehouseIds.length > 0 ? { warehouse: { in: warehouseIds } } : {}),
              ...(goodsIds ? { goods: { in: goodsIds.length > 0 ? goodsIds : [-1] } } : {}),
            },
            select: { pid: true, goods: true, attr: true, warehouse: true, unit: true, nums: true, tpt: true },
          })
        : [];
    const sreInfo =
      sreIds.length > 0
        ? await (this.prisma as any).sreInfo.findMany({
            where: {
              pid: { in: sreIds },
              ...(warehouseIds.length > 0 ? { warehouse: { in: warehouseIds } } : {}),
              ...(goodsIds ? { goods: { in: goodsIds.length > 0 ? goodsIds : [-1] } } : {}),
            },
            select: { pid: true, goods: true, attr: true, warehouse: true, unit: true, nums: true, tpt: true },
          })
        : [];

    const typeVal = Number(type || 0);
    const sellClassMap = new Map<number, any>(sellClass.map((c) => [c.id, c]));
    const sreClassMap = new Map<number, any>(sreClass.map((c) => [c.id, c]));

    const groupKeyFor = (mold: 'sell' | 'sre', row: any) => {
      const cls = mold === 'sell' ? sellClassMap.get(row.pid) : sreClassMap.get(row.pid);
      const prefix = typeVal === 1 ? `c_${cls?.customer || 0}_` : typeVal === 2 ? `u_${cls?.user || 0}_` : typeVal === 3 ? `p_${cls?.people || 0}_` : '';
      return `${prefix}${row.goods}_${row.attr || ''}_${row.warehouse || 0}`;
    };

    const groups = new Map<string, any>();

    const applyRow = (mold: 'sell' | 'sre', row: any) => {
      const key = groupKeyFor(mold, row);
      if (!groups.has(key)) {
        const cls = mold === 'sell' ? sellClassMap.get(row.pid) : sreClassMap.get(row.pid);
        groups.set(key, {
          goods: row.goods,
          attr: row.attr,
          warehouse: row.warehouse,
          unit: row.unit,
          sell: { nums: 0, money: 0, price: 0 },
          sre: { nums: 0, money: 0, price: 0 },
          summary: { nums: 0, money: 0 },
          customerId: typeVal === 1 ? Number(cls?.customer || 0) : 0,
          userId: typeVal === 2 ? Number(cls?.user || 0) : 0,
          peopleId: typeVal === 3 ? Number(cls?.people || 0) : 0,
        });
      }
      const g = groups.get(key);
      const nums = Number(row.nums);
      const money = Number(row.tpt);
      g[mold].nums = Number((g[mold].nums + nums).toFixed(4));
      g[mold].money = Number((g[mold].money + money).toFixed(4));
    };

    sellInfo.forEach((r) => applyRow('sell', r));
    sreInfo.forEach((r) => applyRow('sre', r));

    const goodsIdList = [...new Set(Array.from(groups.values()).map((g) => Number(g.goods)).filter((v) => v))];
    const warehouseIdList = [...new Set(Array.from(groups.values()).map((g) => Number(g.warehouse)).filter((v) => v))];
    const goodsListData =
      goodsIdList.length > 0 ? await this.prisma.goods.findMany({ where: { id: { in: goodsIdList } } }) : [];
    const warehouseListData =
      warehouseIdList.length > 0 ? await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIdList } } }) : [];
    const customerIds = [...new Set(Array.from(groups.values()).map((g) => Number(g.customerId)).filter((v) => v))];
    const userIds = [...new Set(Array.from(groups.values()).map((g) => Number(g.userId)).filter((v) => v))];
    const peopleIds = [...new Set(Array.from(groups.values()).map((g) => Number(g.peopleId)).filter((v) => v))];
    const customerList =
      customerIds.length > 0 ? await this.prisma.customer.findMany({ where: { id: { in: customerIds } } }) : [];
    const userList = userIds.length > 0 ? await this.prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
    const peopleList =
      peopleIds.length > 0 ? await this.prisma.people.findMany({ where: { id: { in: peopleIds } } }) : [];

    const rows = Array.from(groups.values()).map((g) => {
      g.sell.price = g.sell.nums === 0 ? 0 : Number((g.sell.money / g.sell.nums).toFixed(4));
      g.sre.price = g.sre.nums === 0 ? 0 : Number((g.sre.money / g.sre.nums).toFixed(4));
      g.summary.nums = Number((g.sell.nums - g.sre.nums).toFixed(4));
      g.summary.money = Number((g.sell.money - g.sre.money).toFixed(4));
      const goodsData = goodsListData.find((x) => x.id === Number(g.goods)) || null;
      const warehouseData = warehouseListData.find((x) => x.id === Number(g.warehouse)) || null;
      const row: any = {
        goodsData,
        warehouseData,
        attr: g.attr,
        unit: g.unit,
        sell: g.sell,
        sre: g.sre,
        summary: g.summary,
      };
      if (typeVal === 1) row.customer = customerList.find((x) => x.id === Number(g.customerId)) || null;
      if (typeVal === 2) row.user = userList.find((x) => x.id === Number(g.userId)) || null;
      if (typeVal === 3) row.people = peopleList.find((x) => x.id === Number(g.peopleId)) || null;
      return row;
    });

    const count = rows.length;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const info = rows.slice(skip, skip + take);

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }

  async sbt(body: any, user: any) {
    try {
      const { page, limit, customer, number, startTime, endTime, nucleus, mold } = body;
      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

    const molds: string[] = Array.isArray(mold) && mold.length > 0 ? mold : ['sell', 'sre'];

    const timeWhere: any = {};
    if (startTime) timeWhere.gte = dayjs(startTime).startOf('day').unix();
    if (endTime) timeWhere.lte = dayjs(endTime).endOf('day').unix();

    const baseWhere: any = {
      examine: true,
      ...(Object.keys(timeWhere).length > 0 ? { time: timeWhere } : {}),
    };
    if (customer) baseWhere.customer = Number(customer);
    if (number) baseWhere.number = { contains: String(number) };
    if (user && user.role !== 0 && user.frame) baseWhere.frame = Number(user.frame);

    const wantedNucleus: number[] = Array.isArray(nucleus) ? nucleus.map((v: any) => Number(v)) : [];
    const nucleusState = (money: number, actual: number) => {
      if (money === 0) return 0;
      if (actual !== 0 && Math.abs(money) >= Math.abs(actual)) return 2;
      return 1;
    };

    const list: any[] = [];

    if (molds.includes('sell')) {
      const rows = await this.prisma.sell.findMany({
        where: baseWhere,
        select: { id: true, frame: true, customer: true, time: true, number: true, total: true, actual: true, money: true, data: true },
        orderBy: { time: 'desc' },
      });
      rows.forEach((r) => list.push({ mold: 'sell', name: '销售单', row: r, sort: Number(r.time) }));
    }

    if (molds.includes('sre')) {
      const rows = await this.prisma.sre.findMany({
        where: baseWhere,
        select: { id: true, frame: true, customer: true, time: true, number: true, total: true, actual: true, money: true, data: true },
        orderBy: { time: 'desc' },
      });
      rows.forEach((r) => list.push({ mold: 'sre', name: '销售退货单', row: r, sort: Number(r.time) }));
    }

    const mapped: any[] = list
      .map((x) => {
        const total = Number(x.row.total) * (x.mold === 'sre' ? -1 : 1);
        const actual = Number(x.row.actual) * (x.mold === 'sre' ? -1 : 1);
        const money = Number(x.row.money) * (x.mold === 'sre' ? -1 : 1);
        const ns = nucleusState(money, actual);
        return {
          key: `${x.mold}_${x.row.id}`,
          mold: x.mold,
          name: x.name,
          frame: x.row.frame,
          customer: x.row.customer,
          time: dayjs.unix(Number(x.row.time)).format('YYYY-MM-DD'),
          number: x.row.number,
          total,
          actual,
          money,
          balance: Number((actual - money).toFixed(4)),
          rate: actual === 0 ? '0%' : `${Number(((money / actual) * 100).toFixed(2))}%`,
          data: x.row.data || '',
          extension: { nucleus: ns === 0 ? '未核销' : ns === 1 ? '部分核销' : '已核销' },
          frameData: null,
          customerData: null,
          node: [],
        };
      })
      .filter((x) => (wantedNucleus.length > 0 ? wantedNucleus.includes(x.extension.nucleus === '未核销' ? 0 : x.extension.nucleus === '部分核销' ? 1 : 2) : true));

    mapped.sort((a, b) => dayjs(b.time).unix() - dayjs(a.time).unix());

    const count = mapped.length;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const paged = mapped.slice(skip, skip + take);

    const frameIds = [...new Set(paged.map((r) => Number(r.frame)).filter((v) => v !== null && v !== undefined))];
    const customerIds = [...new Set(paged.map((r) => Number(r.customer)).filter((v) => v))];
    const frames = frameIds.length > 0 ? await this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : [];
    const customers =
      customerIds.length > 0 ? await this.prisma.customer.findMany({ where: { id: { in: customerIds } } }) : [];

    const info = paged.map((r) => {
      r.frameData = frames.find((f) => f.id === Number(r.frame)) || null;
      r.customerData = customers.find((c) => c.id === Number(r.customer)) || null;
      return r;
    });

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }
}
