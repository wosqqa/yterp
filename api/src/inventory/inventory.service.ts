import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private add(a: number, b: number): number {
    return Number(a) + Number(b);
  }

  private mul(a: number, b: number): number {
    return Number(a) * Number(b);
  }

  async record(body: any) {
    return { state: 'success', count: 0, info: [], column: [] };
  }

  async exports(query: any) {
    return { state: 'error', info: '暂未实现' };
  }

  async buildEntry(body: any) {
    const { info } = body || {};
    if (!Array.isArray(info)) return { state: 'error', info: '传入参数不完整!' };
    const goodsIds = [...new Set(info.map((i: any) => Number(i.goods)))];
    const warehouseIds = [...new Set(info.map((i: any) => Number(i.warehouse)))];
    const goodsList = await this.prisma.goods.findMany({ where: { id: { in: goodsIds } } });
    const warehouseList = await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } });
    const goodsMap = new Map(goodsList.map((g) => [g.id, g]));
    const warehouseMap = new Map(warehouseList.map((w) => [w.id, w]));
    const resultInfo: any[] = [];
    let totalAmount = 0;
    for (const i of info) {
      const goods = goodsMap.get(Number(i.goods));
      if (!goods) continue;
      const warehouseData = warehouseMap.get(Number(i.warehouse)) || null;
      const price = Number(goods.buy);
      const nums = Number(i.nums);
      const total = this.mul(price, nums);
      resultInfo.push({
        goods: Number(i.goods),
        goodsData: goods,
        attr: i.attr || '',
        unit: i.unit || '',
        warehouse: Number(i.warehouse),
        warehouseData,
        batch: '',
        mfd: '',
        price,
        nums,
        serial: [],
        total,
        data: '',
      });
      totalAmount = this.add(totalAmount, total);
    }
    return { state: 'success', info: { class: { total: totalAmount, type: 1 }, info: resultInfo } };
  }

  async buildExtry(body: any) {
    const { info } = body || {};
    if (!Array.isArray(info)) return { state: 'error', info: '传入参数不完整!' };
    const goodsIds = [...new Set(info.map((i: any) => Number(i.goods)))];
    const warehouseIds = [...new Set(info.map((i: any) => Number(i.warehouse)))];
    const goodsList = await this.prisma.goods.findMany({ where: { id: { in: goodsIds } } });
    const warehouseList = await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } });
    const goodsMap = new Map(goodsList.map((g) => [g.id, g]));
    const warehouseMap = new Map(warehouseList.map((w) => [w.id, w]));
    const resultInfo: any[] = [];
    let totalAmount = 0;
    for (const i of info) {
      const goods = goodsMap.get(Number(i.goods));
      if (!goods) continue;
      const warehouseData = warehouseMap.get(Number(i.warehouse)) || null;
      const price = Number(goods.buy);
      const nums = Math.abs(Number(i.nums));
      const total = this.mul(price, nums);
      resultInfo.push({
        goods: Number(i.goods),
        goodsData: goods,
        attr: i.attr || '',
        unit: i.unit || '',
        warehouse: Number(i.warehouse),
        warehouseData,
        batch: '',
        mfd: '',
        price,
        nums,
        serial: [],
        total,
        data: '',
      });
      totalAmount = this.add(totalAmount, total);
    }
    return { state: 'success', info: { class: { total: totalAmount, type: 1 }, info: resultInfo } };
  }
}
