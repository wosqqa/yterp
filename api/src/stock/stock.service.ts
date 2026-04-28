import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  private md5_16(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex').substring(8, 24);
  }

  private add(a: number, b: number): number {
    return Number(a) + Number(b);
  }

  private toNum(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private parseJson(v: any, fallback: any): any {
    try {
      if (v === null || v === undefined || v === '') return fallback;
      return JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  private unitSwitch(nums: number, units: any[]): any {
    if (!Array.isArray(units) || units.length === 0) return nums;
    const record: Array<{ name: string; nums: number }> = [];
    let remain = nums;
    for (const u of units) {
      const base = this.toNum(u?.nums);
      if (base <= 0) continue;
      if (Math.abs(remain) < base) {
        record.push({ name: String(u?.source || ''), nums: remain });
        remain = 0;
      } else {
        const mod = Math.abs(remain % base);
        record.push({ name: String(u?.source || ''), nums: mod });
        remain = (remain - mod) / base;
      }
    }
    const end = units[units.length - 1] || {};
    record.push({ name: String(end?.name || ''), nums: remain });
    let text = '';
    for (const r of [...record].reverse()) {
      if (this.toNum(r.nums) !== 0) {
        text += `${r.nums}${r.name}`;
      }
    }
    return text === '' ? 0 : text;
  }

  private async findCategoryTreeIds(id: number): Promise<number[]> {
    const rows = await this.prisma.category.findMany({ select: { id: true, pid: true } });
    const map = new Map<number, number[]>();
    for (const r of rows) {
      if (!map.has(r.pid)) map.set(r.pid, []);
      map.get(r.pid)!.push(r.id);
    }
    const result: number[] = [];
    const queue: number[] = [id];
    while (queue.length) {
      const cur = queue.shift()!;
      result.push(cur);
      const children = map.get(cur) || [];
      for (const c of children) queue.push(c);
    }
    return result;
  }

  async record(body: any) {
    const { page, limit, warehouse, state, category, code, name, number, spec, brand } = body || {};
    if (
      page === undefined ||
      limit === undefined ||
      !Array.isArray(warehouse) ||
      state === undefined ||
      ![0, 1, 2, '0', '1', '2'].includes(state)
    ) {
      return { state: 'error', info: '传入参数不完整!' };
    }
    const warehouseWhere: any = warehouse.length
      ? { id: { in: warehouse.map((v: any) => Number(v)) } }
      : {};
    const warehouses = await this.prisma.warehouse.findMany({ where: warehouseWhere, orderBy: { id: 'desc' } });
    const warehouseIds = warehouses.map((w) => w.id);
    const column = warehouses.map((w) => ({ id: w.id, key: `stock_${w.id}`, name: w.name }));

    const andWhere: any = { type: false };
    if (name !== undefined && name !== '') {
      andWhere.OR = [{ name: { contains: String(name) } }, { py: { contains: String(name) } }];
    }
    if (number !== undefined && number !== '') andWhere.number = { contains: String(number) };
    if (spec !== undefined && spec !== '') andWhere.spec = { contains: String(spec) };
    if (brand !== undefined && brand !== '') andWhere.brand = String(brand);
    if (code !== undefined && code !== '') andWhere.code = { contains: String(code) };
    if (category !== undefined && category !== '') {
      const categoryIds = await this.findCategoryTreeIds(Number(category));
      andWhere.category = { in: categoryIds };
    }
    let mainGoods = await this.prisma.goods.findMany({ where: andWhere, orderBy: { id: 'desc' } });

    if (code !== undefined && code !== '') {
      const attrsByCode: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT pid FROM is_attr WHERE code = ?',
        String(code),
      );
      const attrPids = [...new Set(attrsByCode.map((v) => Number(v.pid)).filter(Boolean))];
      if (attrPids.length) {
        const orGoods = await this.prisma.goods.findMany({
          where: { id: { in: attrPids }, type: false },
          orderBy: { id: 'desc' },
        });
        const map = new Map<number, any>();
        for (const g of [...mainGoods, ...orGoods]) map.set(g.id, g);
        mainGoods = [...map.values()].sort((a, b) => b.id - a.id);
      }
    }
    const stateNum = Number(state);
    if (stateNum === 1 || stateNum === 2) {
      const roomRows = warehouseIds.length
        ? await this.prisma.room.findMany({
            where: {
              warehouse: { in: warehouseIds },
              goods: { in: mainGoods.map((g) => g.id) },
            },
            select: { goods: true, nums: true },
          })
        : [];
      if (stateNum === 1) {
        const keepIds = new Set(
          roomRows.filter((r) => this.toNum(r.nums) !== 0).map((r) => r.goods),
        );
        mainGoods = mainGoods.filter((g) => keepIds.has(g.id));
      } else {
        const stockMap = new Map(mainGoods.map((g) => [g.id, this.toNum(g.stock)]));
        const keepIds = new Set<number>();
        for (const r of roomRows) {
          if (this.toNum(r.nums) <= (stockMap.get(r.goods) ?? 0)) keepIds.add(r.goods);
        }
        mainGoods = mainGoods.filter((g) => keepIds.has(g.id));
      }
    }
    const count = mainGoods.length;
    const start = (Number(page) - 1) * Number(limit);
    const goodsPage = mainGoods.slice(start, start + Number(limit));
    const goodsPageIds = goodsPage.map((g) => g.id);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: [...new Set(goodsPage.map((g) => g.category))] } },
    });
    const categoryMap = new Map<number, any>(categories.map((c) => [c.id, c]));

    let attrRows: any[] = [];
    if (goodsPageIds.length) {
      const inIds = goodsPageIds.join(',');
      attrRows = await this.prisma.$queryRawUnsafe(
        `SELECT id,pid,name,buy,sell,code FROM is_attr WHERE pid IN (${inIds}) ORDER BY id DESC`,
      );
    }
    const attrMap = new Map<number, any[]>();
    for (const a of attrRows) {
      if (!attrMap.has(Number(a.pid))) attrMap.set(Number(a.pid), []);
      attrMap.get(Number(a.pid))!.push({
        id: Number(a.id),
        pid: Number(a.pid),
        name: String(a.name),
        buy: this.toNum(a.buy),
        sell: this.toNum(a.sell),
        code: String(a.code || ''),
      });
    }

    const roomRows = goodsPageIds.length
      ? await this.prisma.room.findMany({
          where: {
            warehouse: { in: warehouseIds },
            goods: { in: goodsPageIds },
          },
        })
      : [];

    const gather: any = { g: {}, wg: {}, ga: {}, wga: {} };
    for (const r of roomRows) {
      const n = this.toNum(r.nums);
      const g = this.md5_16(`${r.goods}`);
      gather.g[g] = this.add(gather.g[g] || 0, n);
      const wg = this.md5_16(`${r.warehouse}&${r.goods}`);
      gather.wg[wg] = this.add(gather.wg[wg] || 0, n);
      if (r.attr) {
        const ga = this.md5_16(`${r.goods}&${r.attr}`);
        gather.ga[ga] = this.add(gather.ga[ga] || 0, n);
        const wga = this.md5_16(`${r.warehouse}&${r.goods}&${r.attr}`);
        gather.wga[wga] = this.add(gather.wga[wga] || 0, n);
      }
    }

    const info: any[] = [];
    for (const g of goodsPage) {
      const units = this.parseJson(g.units, []);
      const extension = {
        unit: g.unit === '-1' ? '多单位' : g.unit,
        type: g.type ? '服务商品' : '常规商品',
      };
      let attrs = attrMap.get(g.id) || [];
      if (code !== undefined && code !== '') {
        attrs = attrs.filter((a) => [String(g.code || ''), String(a.code || '')].includes(String(code)));
      }
      attrs = attrs.map((a) => ({ ...a, key: `${g.id}.${a.id}` }));
      const item: any = {
        ...g,
        buy: this.toNum(g.buy),
        sell: this.toNum(g.sell),
        stock: this.toNum(g.stock),
        more: this.parseJson(g.more, {}),
        units,
        categoryData: categoryMap.get(g.category) || null,
        extension,
        attr: attrs,
        key: g.id,
      };
      const gk = this.md5_16(`${g.id}`);
      item.summary = gather.g[gk] !== undefined ? (g.unit === '-1' ? this.unitSwitch(this.toNum(gather.g[gk]), units) : this.toNum(gather.g[gk])) : 0;
      for (const c of column) {
        const wg = this.md5_16(`${c.id}&${g.id}`);
        const base = gather.wg[wg] !== undefined ? this.toNum(gather.wg[wg]) : 0;
        item[`stock_${c.id}`] = g.unit === '-1' ? this.unitSwitch(base, units) : base;
      }
      for (const a of item.attr) {
        const ga = this.md5_16(`${g.id}&${a.name}`);
        const abase = gather.ga[ga] !== undefined ? this.toNum(gather.ga[ga]) : 0;
        a.summary = g.unit === '-1' ? this.unitSwitch(abase, units) : abase;
        for (const c of column) {
          const wga = this.md5_16(`${c.id}&${g.id}&${a.name}`);
          const v = gather.wga[wga] !== undefined ? this.toNum(gather.wga[wga]) : 0;
          a[`stock_${c.id}`] = g.unit === '-1' ? this.unitSwitch(v, units) : v;
        }
      }
      if (stateNum === 1) {
        item.attr = item.attr.filter((a: any) => this.toNum(a.summary) !== 0);
      }
      if (stateNum === 2) {
        item.attr = item.attr.filter((a: any) => {
          for (const c of column) {
            if (this.toNum(a[`stock_${c.id}`]) <= this.toNum(g.stock)) return true;
          }
          return false;
        });
      }
      info.push(item);
    }

    return { state: 'success', count, info, column };
  }

  // 导出库存列表
  async exports(query: any) {
    const { warehouse, state, category, code, name, number, spec, brand } = query;
    let stateNum = 0;
    if (state !== undefined && state !== '') {
        stateNum = Number(state);
    }
    
    let warehouseArr = warehouse;
    if (typeof warehouseArr === 'string') warehouseArr = warehouseArr.split(',');
    
    if (warehouseArr && !Array.isArray(warehouseArr)) {
        warehouseArr = [warehouseArr];
    }
    
    const warehouseWhere: any = warehouseArr && warehouseArr.length
      ? { id: { in: warehouseArr.map((v: any) => Number(v)) } }
      : {};
    const warehouses = await this.prisma.warehouse.findMany({ where: warehouseWhere, orderBy: { id: 'desc' } });
    const warehouseIds = warehouses.map((w) => w.id);
    const column = warehouses.map((w) => ({ id: w.id, key: `stock_${w.id}`, name: w.name }));

    const andWhere: any = { type: false };
    if (name !== undefined && name !== '') {
      andWhere.OR = [{ name: { contains: String(name) } }, { py: { contains: String(name) } }];
    }
    if (number !== undefined && number !== '') andWhere.number = { contains: String(number) };
    if (spec !== undefined && spec !== '') andWhere.spec = { contains: String(spec) };
    if (brand !== undefined && brand !== '') andWhere.brand = String(brand);
    if (code !== undefined && code !== '') andWhere.code = { contains: String(code) };
    if (category !== undefined && category !== '') {
      const categoryIds = await this.findCategoryTreeIds(Number(category));
      andWhere.category = { in: categoryIds };
    }
    let mainGoods = await this.prisma.goods.findMany({ where: andWhere, orderBy: { id: 'desc' } });

    if (code !== undefined && code !== '') {
      const attrsByCode: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT pid FROM is_attr WHERE code = ?',
        String(code),
      );
      const attrPids = [...new Set(attrsByCode.map((v) => Number(v.pid)).filter(Boolean))];
      if (attrPids.length) {
        const orGoods = await this.prisma.goods.findMany({
          where: { id: { in: attrPids }, type: false },
          orderBy: { id: 'desc' },
        });
        const map = new Map<number, any>();
        for (const g of [...mainGoods, ...orGoods]) map.set(g.id, g);
        mainGoods = [...map.values()].sort((a, b) => b.id - a.id);
      }
    }

    if (stateNum === 1 || stateNum === 2) {
      const roomRows = warehouseIds.length
        ? await this.prisma.room.findMany({
            where: {
              warehouse: { in: warehouseIds },
              goods: { in: mainGoods.map((g) => g.id) },
            },
            select: { goods: true, nums: true },
          })
        : [];
      if (stateNum === 1) {
        const keepIds = new Set(
          roomRows.filter((r) => this.toNum(r.nums) !== 0).map((r) => r.goods),
        );
        mainGoods = mainGoods.filter((g) => keepIds.has(g.id));
      } else {
        const stockMap = new Map(mainGoods.map((g) => [g.id, this.toNum(g.stock)]));
        const keepIds = new Set<number>();
        for (const r of roomRows) {
          if (this.toNum(r.nums) <= (stockMap.get(r.goods) ?? 0)) keepIds.add(r.goods);
        }
        mainGoods = mainGoods.filter((g) => keepIds.has(g.id));
      }
    }

    const goodsPageIds = mainGoods.map((g) => g.id);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: [...new Set(mainGoods.map((g) => g.category))] } },
    });
    const categoryMap = new Map<number, any>(categories.map((c) => [c.id, c]));

    let attrRows: any[] = [];
    if (goodsPageIds.length) {
      const inIds = goodsPageIds.join(',');
      attrRows = await this.prisma.$queryRawUnsafe(
        `SELECT id,pid,name,buy,sell,code FROM is_attr WHERE pid IN (${inIds}) ORDER BY id DESC`,
      );
    }
    const attrMap = new Map<number, any[]>();
    for (const a of attrRows) {
      if (!attrMap.has(Number(a.pid))) attrMap.set(Number(a.pid), []);
      attrMap.get(Number(a.pid))!.push({
        id: Number(a.id),
        pid: Number(a.pid),
        name: String(a.name),
        buy: this.toNum(a.buy),
        sell: this.toNum(a.sell),
        code: String(a.code || ''),
      });
    }

    const roomRows = goodsPageIds.length
      ? await this.prisma.room.findMany({
          where: {
            warehouse: { in: warehouseIds },
            goods: { in: goodsPageIds },
          },
        })
      : [];

    const gather: any = { g: {}, wg: {}, ga: {}, wga: {} };
    for (const r of roomRows) {
      const n = this.toNum(r.nums);
      const g = this.md5_16(`${r.goods}`);
      gather.g[g] = this.add(gather.g[g] || 0, n);
      const wg = this.md5_16(`${r.warehouse}&${r.goods}`);
      gather.wg[wg] = this.add(gather.wg[wg] || 0, n);
      if (r.attr) {
        const ga = this.md5_16(`${r.goods}&${r.attr}`);
        gather.ga[ga] = this.add(gather.ga[ga] || 0, n);
        const wga = this.md5_16(`${r.warehouse}&${r.goods}&${r.attr}`);
        gather.wga[wga] = this.add(gather.wga[wga] || 0, n);
      }
    }

    const info: any[] = [];
    for (const g of mainGoods) {
      const units = this.parseJson(g.units, []);
      const extension = {
        unit: g.unit === '-1' ? '多单位' : g.unit,
        type: g.type ? '服务商品' : '常规商品',
      };
      let attrs = attrMap.get(g.id) || [];
      if (code !== undefined && code !== '') {
        attrs = attrs.filter((a) => [String(g.code || ''), String(a.code || '')].includes(String(code)));
      }
      attrs = attrs.map((a) => ({ ...a, key: `${g.id}.${a.id}` }));
      const item: any = {
        ...g,
        buy: this.toNum(g.buy),
        sell: this.toNum(g.sell),
        stock: this.toNum(g.stock),
        more: this.parseJson(g.more, {}),
        units,
        categoryData: categoryMap.get(g.category) || null,
        extension,
        attr: attrs,
        key: g.id,
      };
      const gk = this.md5_16(`${g.id}`);
      item.summary = gather.g[gk] !== undefined ? (g.unit === '-1' ? this.unitSwitch(this.toNum(gather.g[gk]), units) : this.toNum(gather.g[gk])) : 0;
      for (const c of column) {
        const wg = this.md5_16(`${c.id}&${g.id}`);
        const base = gather.wg[wg] !== undefined ? this.toNum(gather.wg[wg]) : 0;
        item[`stock_${c.id}`] = g.unit === '-1' ? this.unitSwitch(base, units) : base;
      }
      for (const a of item.attr) {
        const ga = this.md5_16(`${g.id}&${a.name}`);
        const abase = gather.ga[ga] !== undefined ? this.toNum(gather.ga[ga]) : 0;
        a.summary = g.unit === '-1' ? this.unitSwitch(abase, units) : abase;
        for (const c of column) {
          const wga = this.md5_16(`${c.id}&${g.id}&${a.name}`);
          const v = gather.wga[wga] !== undefined ? this.toNum(gather.wga[wga]) : 0;
          a[`stock_${c.id}`] = g.unit === '-1' ? this.unitSwitch(v, units) : v;
        }
      }
      if (stateNum === 1) {
        item.attr = item.attr.filter((a: any) => this.toNum(a.summary) !== 0);
      }
      if (stateNum === 2) {
        item.attr = item.attr.filter((a: any) => {
          for (const c of column) {
            if (this.toNum(a[`stock_${c.id}`]) <= this.toNum(g.stock)) return true;
          }
          return false;
        });
      }
      info.push(item);
    }

    const source: any[] = [];
    for (const infoVo of info) {
        source.push(infoVo);
        if (infoVo.attr && infoVo.attr.length > 0) {
            for (const attrVo of infoVo.attr) {
                attrVo.name = '|- ' + attrVo.name;
                source.push(attrVo);
            }
        }
    }

    const XLSX = require('xlsx');

    const headers = ['商品名称', '库存数量', ...column.map(c => c.name), '预警阈值', '商品编号', '规格型号', '商品分类', '商品品牌', '商品单位', '商品条码', '商品备注'];

    const excelData = source.map(item => {
        const row = [
            item.name || '',
            item.summary || 0
        ];
        
        for (const c of column) {
            row.push(item[`stock_${c.id}`] || 0);
        }
        
        row.push(item.stock || 0);
        row.push(item.number || '');
        row.push(item.spec || '');
        row.push(item.categoryData?.name || '');
        row.push(item.brand || '');
        row.push(item.extension?.unit || '');
        row.push(item.code || '');
        row.push(item.data || '');

        return row;
    });

    excelData.unshift(headers);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '库存列表');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return { state: 'success', buffer };
  }

  // 获取明细记录
  async detailRecord(body: any) {
    const { page, limit, goods, warehouse, type, attr } = body || {};
    const sheet = ['buy', 'bre', 'sell', 'sre', 'swapOut', 'swapEnter', 'entry', 'extry'];
    const selectedTypes = type || sheet;

    if (!page || !limit || !goods || !warehouse || !Array.isArray(warehouse) || !Array.isArray(selectedTypes)) {
      return { state: 'error', info: '传入参数不完整!' };
    }

    // 1. Get room data
    const roomWhere: any = {
      warehouse: { in: warehouse.map(Number) },
      goods: Number(goods),
    };
    if (attr) {
      roomWhere.attr = attr;
    }
    
    const rooms = await this.prisma.room.findMany({
      where: roomWhere,
      select: { id: true }
    });

    if (rooms.length === 0) {
      return { state: 'success', count: 0, info: [] };
    }

    const roomIds = rooms.map(r => r.id);

    // 2. Base query for room_info
    const infoWhere: any = {
      pid: { in: roomIds },
      type: { in: selectedTypes }
    };

    // Note: PHP code does complex UNION queries with whereExists.
    // In Prisma, we'll fetch the RoomInfo first, then populate the relations.
    // Since we need to filter by time/number from the source documents,
    // it's tricky in Prisma without raw SQL. We will use raw SQL for the exact match
    // or fetch info first and filter in memory if it's not too large.
    // But for pagination, we need raw SQL.

    let typeFilter = `'${selectedTypes.join("','")}'`;
    let pidFilter = roomIds.join(',');

    let sql = `
        SELECT i.* 
        FROM is_room_info i
        WHERE i.pid IN (${pidFilter}) 
        AND i.type IN (${typeFilter})
    `;

    // 3. Subquery filters (time, number) -> We need to join with source tables
    // To simplify and make it robust, we'll build a union of the source tables that match the criteria
    // and join it with room_info.
    
    // Simplification for Prisma: 
    // We will just query RoomInfo directly, but we need to join the source tables to filter by 'number', 'startTime', 'endTime'.
    // If no such filters exist, we can just use Prisma's findMany.

    const hasSourceFilters = body.number || body.startTime || body.endTime;

    let count = 0;
    let info: any[] = [];

    if (hasSourceFilters) {
        // We will execute a raw query
        // This is complex. Let's do a simplified approach:
        // Get all RoomInfo matching pid and type.
        // Then manually fetch sourceData and filter.
        // If data is huge, this is slow. But standard Prisma doesn't support polymorphic joins easily.
        
        const rawInfo = await this.prisma.roomInfo.findMany({
            where: infoWhere,
            orderBy: { id: 'desc' }
        });

        const filteredInfo: any[] = [];
        for (const item of rawInfo) {
            // Get source data
            const sourceTable = this.getSourceTable(item.type);
            if (!sourceTable) continue;

            const sourceData: any = await (this.prisma as any)[sourceTable].findUnique({
                where: { id: item.class }
            });

            if (!sourceData) continue;

            // Apply filters
            let match = true;
            if (body.number && !sourceData.number.includes(body.number)) match = false;
            if (body.startTime && sourceData.time < new Date(body.startTime).getTime() / 1000) match = false;
            if (body.endTime && sourceData.time > new Date(body.endTime).getTime() / 1000 + 86399) match = false;

            if (match) {
                // Get frameData
                let frameData: any = null;
                if (sourceData.frame) {
                    frameData = await this.prisma.frame.findUnique({ where: { id: sourceData.frame } });
                }
                
                filteredInfo.push({
                    ...item,
                    sourceData: {
                        ...sourceData,
                        frameData
                    },
                    extension: this.getExtension(item)
                });
            }
        }

        count = filteredInfo.length;
        const start = (Number(page) - 1) * Number(limit);
        info = filteredInfo.slice(start, start + Number(limit));

    } else {
        // No source filters, we can use Prisma pagination
        count = await this.prisma.roomInfo.count({ where: infoWhere });
        const rawInfo = await this.prisma.roomInfo.findMany({
            where: infoWhere,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' }
        });

        // Populate sourceData
        for (const item of rawInfo) {
            const sourceTable = this.getSourceTable(item.type);
            let sourceData: any = null;
            let frameData: any = null;
            if (sourceTable) {
                sourceData = await (this.prisma as any)[sourceTable].findUnique({
                    where: { id: item.class }
                });
                if (sourceData && sourceData.frame) {
                    frameData = await this.prisma.frame.findUnique({ where: { id: sourceData.frame } });
                }
            }
            info.push({
                ...item,
                sourceData: sourceData ? { ...sourceData, frameData } : null,
                extension: this.getExtension(item)
            });
        }
    }

    // Process units
    if (info.length > 0) {
        const goodsData = await this.prisma.goods.findUnique({ where: { id: Number(goods) } });
        if (goodsData && goodsData.unit === '-1') {
            const units = this.parseJson(goodsData.units, []);
            for (const item of info) {
                item.nums = this.unitSwitch(Number(item.nums), units);
            }
        }
    }

    return { state: 'success', count, info };
  }

  private getSourceTable(type: string) {
      const map: any = {
          buy: 'buy', bre: 'bre', sell: 'sell', sre: 'sre',
          swapOut: 'swap', swapEnter: 'swap', entry: 'entry', extry: 'extry',
          vend: 'vend', vre: 'vre', barter: 'barter'
      };
      return map[type];
  }

  private getExtension(item: any) {
      const typeMap: any = {
          buy: "采购单", bre: "采购退货单", sell: "销售单", sre: "销售退货单",
          vend: "零售单", vre: "零售退货单", barter: "积分兑换单",
          swapOut: "调拨单-出", swapEnter: "调拨单-入", entry: "其它入库单", extry: "其它出库单"
      };
      const dirMap: any = {
          0: "减少", 1: "增加"
      };
      return {
          type: typeMap[item.type] || item.type,
          direction: dirMap[item.direction ? 1 : 0]
      };
  }

  async detailExports(query: any) {
    const { goods, warehouse, type, attr, number, startTime, endTime } = query;
    const sheet = ['buy', 'bre', 'sell', 'sre', 'swapOut', 'swapEnter', 'entry', 'extry'];
    let selectedTypes = type;
    if (typeof selectedTypes === 'string') selectedTypes = selectedTypes.split(',');
    if (!selectedTypes || selectedTypes.length === 0) selectedTypes = sheet;

    if (!goods || !warehouse) {
      return { state: 'error', info: '传入数据不完整!' };
    }

    let warehouseArr = warehouse;
    if (typeof warehouseArr === 'string') warehouseArr = warehouseArr.split(',');

    const goodsData = await this.prisma.goods.findUnique({ where: { id: Number(goods) } });

    // 1. Get room data
    const roomWhere: any = {
      warehouse: { in: warehouseArr.map(Number) },
      goods: Number(goods),
    };
    if (attr) roomWhere.attr = attr;
    
    const rooms = await this.prisma.room.findMany({
      where: roomWhere,
      select: { id: true }
    });

    let source: any[] = [];

    if (rooms.length > 0) {
        const roomIds = rooms.map(r => r.id);
        const infoWhere: any = {
          pid: { in: roomIds },
          type: { in: selectedTypes }
        };

        const rawInfo = await this.prisma.roomInfo.findMany({
            where: infoWhere,
            orderBy: { id: 'desc' }
        });

        for (const item of rawInfo) {
            const sourceTable = this.getSourceTable(item.type);
            if (!sourceTable) continue;

            const sourceData: any = await (this.prisma as any)[sourceTable].findUnique({
                where: { id: item.class }
            });

            if (!sourceData) continue;

            let match = true;
            if (number && !sourceData.number.includes(number)) match = false;
            if (startTime && sourceData.time < new Date(startTime).getTime() / 1000) match = false;
            if (endTime && sourceData.time > new Date(endTime).getTime() / 1000 + 86399) match = false;

            if (match) {
                let frameData: any = null;
                if (sourceData.frame) {
                    frameData = await this.prisma.frame.findUnique({ where: { id: sourceData.frame } });
                }
                
                source.push({
                    ...item,
                    sourceData: {
                        ...sourceData,
                        frameData
                    },
                    extension: this.getExtension(item)
                });
            }
        }

        // Process units
        if (goodsData && goodsData.unit === '-1') {
            const units = this.parseJson(goodsData.units, []);
            for (const item of source) {
                item.nums = this.unitSwitch(Number(item.nums), units);
            }
        }
    }

    // Generate Excel
    const XLSX = require('xlsx');

    const excelData = source.map(item => {
        const timeStr = item.sourceData && item.sourceData.time 
            ? new Date(item.sourceData.time * 1000).toISOString().split('T')[0] 
            : '';
            
        return [
            item.sourceData?.frameData?.name || '',
            timeStr,
            item.extension?.type || '',
            item.sourceData?.number || '',
            item.extension?.direction || '',
            item.nums
        ];
    });

    const headers = ['所属组织', '操作时间', '单据类型', '单据编号', '操作类型', '操作数量'];
    excelData.unshift(headers);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '库存详情');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return { state: 'success', buffer };
  }
}
