import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class BrtService {
  constructor(private prisma: PrismaService) {}

  async btt(body: any, user: any) {
    return { state: 'success', count: 0, info: [] };
  }

  async bsy(body: any, user: any) {
    return { state: 'success', count: 0, info: [] };
  }

  async bbt(body: any, user: any) {
    return { state: 'success', count: 0, info: [] };
  }

  async bot(body: any, user: any) {
    return { state: 'success', count: 0, info: [] };
  }

  async blt(body: any, user: any) {
    try {
      const { page, limit, supplier, goods, number, warehouse, startTime, endTime, mold, data } = body;
      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

    const molds: string[] = Array.isArray(mold) && mold.length > 0 ? mold : ['buy', 'bre'];
    const warehouseIds: number[] = Array.isArray(warehouse) ? warehouse.map((v: any) => Number(v)).filter((v: any) => v) : [];

    const timeWhere: any = {};
    if (startTime) timeWhere.gte = dayjs(startTime).startOf('day').unix();
    if (endTime) timeWhere.lte = dayjs(endTime).endOf('day').unix();
    const baseClassWhere: any = {
      examine: true,
      ...(Object.keys(timeWhere).length > 0 ? { time: timeWhere } : {}),
    };
    if (supplier) baseClassWhere.supplier = Number(supplier);
    if (number) baseClassWhere.number = { contains: String(number) };
    if (data) baseClassWhere.data = { contains: String(data) };
    if (user && user.role !== 0 && user.frame) baseClassWhere.frame = Number(user.frame);

    let goodsIds: number[] | null = null;
    if (goods) {
      const goodsList = await this.prisma.goods.findMany({
        where: { OR: [{ name: { contains: String(goods) } }, { py: { contains: String(goods) } }] },
        select: { id: true },
      });
      goodsIds = goodsList.map((g) => g.id);
    }

    const records: any[] = [];

    if (molds.includes('buy')) {
      const buyClasses = await this.prisma.buy.findMany({
        where: baseClassWhere,
        select: { id: true, time: true },
      });
      const buyIds = buyClasses.map((c) => c.id);
      if (buyIds.length > 0) {
        const infoWhere: any = { pid: { in: buyIds } };
        if (warehouseIds.length > 0) infoWhere.warehouse = { in: warehouseIds };
        if (goodsIds) infoWhere.goods = { in: goodsIds.length > 0 ? goodsIds : [-1] };

        const buyInfos = await this.prisma.buyInfo.findMany({
          where: infoWhere,
          select: {
            id: true,
            pid: true,
            goods: true,
            attr: true,
            warehouse: true,
            unit: true,
            price: true,
            nums: true,
            dsc: true,
            total: true,
            tat: true,
            tpt: true,
            data: true,
          },
        });
        const timeMap = new Map<number, number>(buyClasses.map((c) => [c.id, c.time]));
        buyInfos.forEach((info) => {
          records.push({
            mold: 'buy',
            name: '采购单',
            classId: info.pid,
            sort: timeMap.get(info.pid) || 0,
            info,
          });
        });
      }
    }

    if (molds.includes('bre')) {
      const breClasses = await this.prisma.bre.findMany({
        where: baseClassWhere,
        select: { id: true, time: true },
      });
      const breIds = breClasses.map((c) => c.id);
      if (breIds.length > 0) {
        const infoWhere: any = { pid: { in: breIds } };
        if (warehouseIds.length > 0) infoWhere.warehouse = { in: warehouseIds };
        if (goodsIds) infoWhere.goods = { in: goodsIds.length > 0 ? goodsIds : [-1] };

        const breInfos = await this.prisma.breInfo.findMany({
          where: infoWhere,
          select: {
            id: true,
            pid: true,
            goods: true,
            attr: true,
            warehouse: true,
            unit: true,
            price: true,
            nums: true,
            dsc: true,
            total: true,
            tat: true,
            tpt: true,
            data: true,
          },
        });
        const timeMap = new Map<number, number>(breClasses.map((c) => [c.id, c.time]));
        breInfos.forEach((info) => {
          records.push({
            mold: 'bre',
            name: '采购退货单',
            classId: info.pid,
            sort: timeMap.get(info.pid) || 0,
            info,
          });
        });
      }
    }

    records.sort((a, b) => b.sort - a.sort);
    const count = records.length;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const paged = records.slice(skip, skip + take);

    const buyClassIds = paged.filter((r) => r.mold === 'buy').map((r) => r.classId);
    const breClassIds = paged.filter((r) => r.mold === 'bre').map((r) => r.classId);

    const buyClassList =
      buyClassIds.length > 0
        ? await this.prisma.buy.findMany({
            where: { id: { in: buyClassIds } },
            select: { id: true, frame: true, supplier: true, time: true, number: true, data: true },
          })
        : [];
    const breClassList =
      breClassIds.length > 0
        ? await this.prisma.bre.findMany({
            where: { id: { in: breClassIds } },
            select: { id: true, frame: true, supplier: true, time: true, number: true, data: true },
          })
        : [];

    const classList = [
      ...buyClassList.map((c) => ({ mold: 'buy', ...c })),
      ...breClassList.map((c) => ({ mold: 'bre', ...c })),
    ];

    const frameIds = [...new Set(classList.map((c) => Number(c.frame)).filter((v) => v !== null && v !== undefined))];
    const supplierIds = [...new Set(classList.map((c) => Number(c.supplier)).filter((v) => v !== null && v !== undefined))];

    const frames = frameIds.length > 0 ? await this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : [];
    const suppliers =
      supplierIds.length > 0 ? await this.prisma.supplier.findMany({ where: { id: { in: supplierIds } } }) : [];

    const goodsIdList = [...new Set(paged.map((r) => Number(r.info.goods)).filter((v) => v))];
    const warehouseIdList = [
      ...new Set(paged.map((r) => Number(r.info.warehouse)).filter((v) => v !== null && v !== undefined)),
    ];
    const goodsListData =
      goodsIdList.length > 0 ? await this.prisma.goods.findMany({ where: { id: { in: goodsIdList } } }) : [];
    const warehouseListData =
      warehouseIdList.length > 0 ? await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIdList } } }) : [];

    const info = paged.map((row) => {
      const c = classList.find((x) => x.mold === row.mold && x.id === row.classId);
      const frameData = c ? frames.find((f) => f.id === Number(c.frame)) || null : null;
      const supplierData = c ? suppliers.find((s) => s.id === Number(c.supplier)) || null : null;
      const classObj = c
        ? {
            ...c,
            time: dayjs.unix(Number(c.time)).format('YYYY-MM-DD'),
            frameData,
            supplierData,
          }
        : null;
      const goodsData = goodsListData.find((g) => g.id === Number(row.info.goods)) || null;
      const warehouseData = warehouseListData.find((w) => w.id === Number(row.info.warehouse)) || null;
      const infoObj = {
        ...row.info,
        price: Number(row.info.price),
        nums: Number(row.info.nums),
        dsc: Number(row.info.dsc),
        total: Number(row.info.total),
        tat: Number(row.info.tat),
        tpt: Number(row.info.tpt),
        goodsData,
        warehouseData,
      };
      return { mold: row.mold, name: row.name, class: classObj, info: infoObj };
    });

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }
}
