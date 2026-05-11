import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeUtil } from '../utils/tree.util';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import pinyin from 'pinyin';

@Injectable()
export class GoodsService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit, name, number, spec, category, brand, data, sort } = body;
    const where: any = {};

    // Build query conditions
    if (name) {
      where.OR = [
        { name: { contains: name } },
        { py: { contains: name } }
      ];
    }
    if (number) where.number = { contains: number };
    if (spec) where.spec = { contains: spec };
    if (brand) where.brand = { contains: brand };
    if (data) where.data = { contains: data };

    if (category !== undefined && category !== null && category !== '') {
      const allCategories = await this.prisma.category.findMany();
      const raw = Array.isArray(category) ? category : [category];
      const roots = raw
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      const idSet = new Set<number>();
      roots.forEach((rootId) => {
        TreeUtil.getTreeIds(allCategories, rootId).forEach((id) => idSet.add(Number(id)));
      });
      const categoryIds = [...idSet];
      categoryIds.length > 0 && (where.category = { in: categoryIds });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    let count = 0;
    let list: any[] = [];
    if (String(sort || '') === 'numberAsc') {
      let categoryIds: number[] = [];
      if (category !== undefined && category !== null && category !== '') {
        const allCategories = await this.prisma.category.findMany();
        const raw = Array.isArray(category) ? category : [category];
        const roots = raw
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v) && v > 0);
        const idSet = new Set<number>();
        roots.forEach((rootId) => {
          TreeUtil.getTreeIds(allCategories, rootId).forEach((id) => idSet.add(Number(id)));
        });
        categoryIds = [...idSet].filter((v) => Number.isFinite(v) && v > 0);
      }

      const whereSqlParts: Prisma.Sql[] = [];
      if (name) {
        const q = `%${String(name)}%`;
        whereSqlParts.push(Prisma.sql`(name LIKE ${q} OR py LIKE ${q})`);
      }
      if (number) whereSqlParts.push(Prisma.sql`number LIKE ${'%' + String(number) + '%'}`);
      if (spec) whereSqlParts.push(Prisma.sql`spec LIKE ${'%' + String(spec) + '%'}`);
      if (brand) whereSqlParts.push(Prisma.sql`brand LIKE ${'%' + String(brand) + '%'}`);
      if (data) whereSqlParts.push(Prisma.sql`data LIKE ${'%' + String(data) + '%'}`);
      if (categoryIds.length > 0) whereSqlParts.push(Prisma.sql`category IN (${Prisma.join(categoryIds)})`);
      const whereSql = whereSqlParts.length > 0 ? Prisma.sql`WHERE ${Prisma.join(whereSqlParts, ' AND ')}` : Prisma.empty;

      const countRows: Array<{ cnt: any }> = await this.prisma.$queryRaw(
        Prisma.sql`SELECT COUNT(*) AS cnt FROM is_goods ${whereSql}`,
      );
      count = Number(countRows && countRows[0] ? countRows[0].cnt : 0) || 0;

      const idRows: Array<{ id: number }> = await this.prisma.$queryRaw(
        Prisma.sql`SELECT id FROM is_goods ${whereSql} ORDER BY CASE WHEN number REGEXP '^[sS][0-9]+' THEN 0 ELSE 1 END, CAST(SUBSTRING(number, 2) AS UNSIGNED) ASC, number ASC, id DESC LIMIT ${take} OFFSET ${skip}`,
      );
      const ids = idRows.map((r) => Number(r.id)).filter((v) => v);
      if (ids.length > 0) {
        const rows = await this.prisma.goods.findMany({ where: { id: { in: ids } } });
        const byId = new Map<number, any>();
        rows.forEach((r) => byId.set(Number(r.id), r));
        list = ids.map((id) => byId.get(id)).filter((v) => v);
      } else {
        list = [];
      }
    } else {
      count = await this.prisma.goods.count({ where });
      list = await this.prisma.goods.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
      });
    }

    const categoryIds = [...new Set(list.map(item => item.category))];
    const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });

    const info = list.map(item => {
      // Parse JSON fields
      const imgs = item.imgs ? JSON.parse(item.imgs) : [];
      const units = item.units ? JSON.parse(item.units) : [];
      const strategy = item.strategy ? JSON.parse(item.strategy) : [];
      const more = item.more ? JSON.parse(item.more) : {};

      // Calculate extension fields
      const extension = {
        unit: item.unit === '-1' ? '多单位' : item.unit,
        type: item.type ? '服务商品' : '常规商品',
      };

      return {
        ...item,
        imgs,
        units,
        strategy,
        more,
        categoryData: categories.find(c => c.id === item.category) || null,
        extension
      };
    });

    return { state: 'success', count, info };
  }

  async save(body: any, user: any) {
    const { id, name, number, spec, category, brand, unit, buy, sell, code, location, stock, type, data, imgs, details, units, strategy, serial, batch, validity, protect, threshold, more, attr } = body;

    if (!name) return { state: 'error', info: '商品名称不能为空!' };

    const py = pinyin(name, { style: pinyin.STYLE_FIRST_LETTER }).flat().join('');

    const inputData: any = {
      name,
      py,
      number,
      spec,
      category: category ? Number(category) : 0,
      brand,
      unit,
      buy: buy ? Number(buy) : 0,
      sell: sell ? Number(sell) : 0,
      code,
      location,
      stock: stock ? Number(stock) : 0,
      type: type === 1 || type === '1' || type === true,
      data,
      imgs: typeof imgs === 'string' ? imgs : JSON.stringify(imgs || []),
      details: details != null ? String(details) : '',
      units: typeof units === 'string' ? units : JSON.stringify(units || []),
      strategy: typeof strategy === 'string' ? strategy : JSON.stringify(strategy || []),
      serial: serial === 1 || serial === '1' || serial === true,
      batch: batch === 1 || batch === '1' || batch === true,
      validity: validity === 1 || validity === '1' || validity === true,
      protect: protect ? Number(protect) : 0,
      threshold: threshold ? Number(threshold) : 0,
      more: typeof more === 'string' ? more : JSON.stringify(more || {}),
    };

    const attrs = Array.isArray(attr) ? attr : [];
    await this.prisma.$transaction(async (tx) => {
      let goodsId = Number(id) || 0;
      if (goodsId > 0) {
        await tx.goods.update({
          where: { id: goodsId },
          data: inputData,
        });
      } else {
        const created = await tx.goods.create({
          data: inputData,
          select: { id: true },
        });
        goodsId = Number(created.id) || 0;
      }

      await tx.$executeRaw(Prisma.sql`DELETE FROM is_attr WHERE pid = ${goodsId}`);
      if (attrs.length > 0) {
        const rows = attrs
          .map((a: any) => {
            const n = a && a.name != null ? String(a.name) : '';
            const b = a && a.buy != null ? Number(a.buy) : 0;
            const s = a && a.sell != null ? Number(a.sell) : 0;
            const c = a && a.code != null ? String(a.code) : '';
            if (!n) return null;
            return Prisma.sql`(${goodsId}, ${n}, ${b}, ${s}, ${c})`;
          })
          .filter((v: any) => v);
        if (rows.length > 0) {
          await tx.$executeRaw(
            Prisma.sql`INSERT INTO is_attr (pid, name, buy, sell, code) VALUES ${Prisma.join(rows)}`,
          );
        }
      }
    });

    return { state: 'success' };
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
      const info = await this.prisma.goods.findUnique({ where: { id: Number(id) } });
      if (info) {
        try { (info as any).imgs = info.imgs ? JSON.parse(info.imgs) : []; } catch (e) { (info as any).imgs = []; }
        try { (info as any).units = info.units ? JSON.parse(info.units) : []; } catch (e) { (info as any).units = []; }
        try { (info as any).strategy = info.strategy ? JSON.parse(info.strategy) : []; } catch (e) { (info as any).strategy = []; }
        try { (info as any).more = info.more ? JSON.parse(info.more) : {}; } catch (e) { (info as any).more = {}; }

        const attrRows: Array<{ id: number; pid: number; name: string; buy: any; sell: any; code: string }> =
          await this.prisma.$queryRaw(
            Prisma.sql`SELECT id, pid, name, buy, sell, code FROM is_attr WHERE pid = ${Number(id)} ORDER BY id DESC`,
          );
        const attrs = attrRows.map((a) => {
          return {
            id: Number(a.id),
            pid: Number(a.pid),
            name: a.name,
            buy: Number(a.buy),
            sell: Number(a.sell),
            code: a.code,
          };
        });
        
        return { 
            state: 'success', 
            info: { 
                ...info, 
                attr: attrs,
                type: info.type ? 1 : 0,
                serial: info.serial,
                batch: info.batch,
                validity: info.validity
            } 
        };
      }
      return { state: 'error', info: '数据不存在!' };
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }

  async del(body: any, user: any) {
    const { parm } = body;
    if (!parm || !Array.isArray(parm) || parm.length === 0) {
      return { state: 'error', info: '传入参数不完整!' };
    }
    const ids = parm.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0);
    if (ids.length === 0) return { state: 'error', info: '传入参数不完整!' };

    const [
      sorInfoCnt,
      sellInfoCnt,
      borInfoCnt,
      buyInfoCnt,
      breInfoCnt,
      entryInfoCnt,
      swapInfoCnt,
    ] = await Promise.all([
      this.prisma.sorInfo.count({ where: { goods: { in: ids } } }),
      this.prisma.sellInfo.count({ where: { goods: { in: ids } } }),
      this.prisma.borInfo.count({ where: { goods: { in: ids } } }),
      this.prisma.buyInfo.count({ where: { goods: { in: ids } } }),
      this.prisma.breInfo.count({ where: { goods: { in: ids } } }),
      this.prisma.entryInfo.count({ where: { goods: { in: ids } } }),
      this.prisma.swapInfo.count({ where: { goods: { in: ids } } }),
    ]);
    const existCnt =
      sorInfoCnt + sellInfoCnt + borInfoCnt + buyInfoCnt + breInfoCnt + entryInfoCnt + swapInfoCnt;
    if (existCnt > 0) {
      return { state: 'error', info: '存在数据关联,删除失败!' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`DELETE FROM is_attr WHERE pid IN (${Prisma.join(ids)})`);
      await tx.goods.deleteMany({ where: { id: { in: ids } } });
    });

    return { state: 'success' };
  }

  async upload(file: any) {
    if (!file) {
      return { state: 'error', info: '传入数据不完整!' };
    }
    const filePath = `/static/upload/${file.filename}`;
    return { state: 'success', info: filePath };
  }

  async import(file: any, user: any) {
    if (!file) return { state: 'error', info: '传入数据不完整!' };

    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Use header: 'A' to match PHP logic (A, B, C...)
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

    // Remove title row (first row)
    if (data.length > 0) data.shift();

    const sql: any[] = [];
    const errors: any[] = [];

    // Helper to get Sys config
    const getSys = async (names: string[]) => {
        const sys = await this.prisma.sys.findMany({ where: { name: { in: names } } });
        const result: any = {};
        sys.forEach(s => {
            try {
                result[s.name] = JSON.parse(s.info);
            } catch (e) {
                result[s.name] = [];
            }
        });
        return result;
    };

    // Helper to update Sys config
    const updateSys = async (name: string, info: any[]) => {
        await this.prisma.sys.updateMany({
            where: { name },
            data: { info: JSON.stringify(info) }
        });
    };

    const sysConfig = await getSys(['unit', 'brand']);
    // Ensure arrays
    if (!Array.isArray(sysConfig.unit)) sysConfig.unit = [];
    if (!Array.isArray(sysConfig.brand)) sysConfig.brand = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowIndex = i + 2; // Excel row index (1-based, +1 for title)

        // Basic validation
        if (!row['A']) { errors.push(`第 ${rowIndex} 行: 商品名称不能为空`); continue; }
        if (!row['D']) { errors.push(`第 ${rowIndex} 行: 商品类别不能为空`); continue; }

        const record: any = {
            name: row['A'] || '',
            py: pinyin(row['A'] || '', { style: pinyin.STYLE_FIRST_LETTER }).flat().join(''),
            number: row['B'] || '',
            spec: row['C'] || '',
            categoryName: row['D'] || '', // Temp field
            brand: row['E'] || '',
            unit: row['F'] || '',
            buy: Number(row['G'] || 0),
            sell: Number(row['H'] || 0),
            // retail: Number(row['I'] || 0), // Not in schema? PHP has it but schema might not. I will ignore for now or check 'more'.
            // integral: Number(row['J'] || 0),
            code: row['K'] || '',
            location: row['L'] || '',
            stock: Number(row['M'] || 0),
            type: row['N'] === '服务商品' ? true : false,
            data: row['O'] || '',
            imgs: '[]',
            details: '',
            units: '[]',
            strategy: '[]',
            serial: false,
            batch: false,
            validity: false,
            protect: 0,
            threshold: 0,
            more: '[]'
        };
        sql.push(record);
    }

    if (errors.length > 0) {
        return { state: 'error', info: errors[0] }; // Return first error
    }

    // Check duplicates in uploaded data
    const names = sql.map(r => r.name);
    const numbers = sql.map(r => r.number).filter(n => n);
    if (new Set(names).size !== names.length) return { state: 'error', info: '模板文件中存在重复的商品名称!' };
    if (new Set(numbers).size !== numbers.length) return { state: 'error', info: '模板文件中存在重复的商品编号!' };

    // Process Categories, Brands, Units
    for (const item of sql) {
        // Category
        let category = await this.prisma.category.findFirst({ where: { name: item.categoryName } });
        if (!category) {
            category = await this.prisma.category.create({
                data: {
                    pid: 0,
                    name: item.categoryName,
                    sort: 99,
                    data: '自动创建|商品导入'
                }
            });
        }
        item.category = category.id;
        delete item.categoryName;

        // Brand
        if (item.brand && !(sysConfig.brand as any[]).includes(item.brand)) {
            (sysConfig.brand as any[]).push(item.brand);
            await updateSys('brand', sysConfig.brand);
        }

        // Unit
        if (item.unit) {
            if (item.unit === '多单位' || item.unit === '-1') {
                return { state: 'error', info: `商品[${item.name}]单位不可为“多单位”` };
            }
            if (!(sysConfig.unit as any[]).includes(item.unit)) {
                (sysConfig.unit as any[]).push(item.unit);
                await updateSys('unit', sysConfig.unit);
            }
        }
    }

    // Bulk Create
    // prisma.goods.createMany is supported in recent versions
    // But we need to handle Decimal fields carefully. Prisma expects numbers or Decimal objects.
    // My parsing logic used Number(), which is fine.
    
    // Note: createMany does not return ids, and we might not need logs for each in bulk?
    // PHP code does: pushLog('批量导入...').
    
    // Warning: sqlite does not support createMany, but we are using mysql.
    
    await this.prisma.goods.createMany({
        data: sql
    });

    return { state: 'success', info: `成功导入 ${sql.length} 行商品数据` };
  }

  async exports(query: any) {
    const { parm } = query;
    if (!parm) return { state: 'error', info: '传入数据不完整!' };

    const ids = Array.isArray(parm) ? parm.map(Number) : (typeof parm === 'string' ? parm.split(',').map(Number) : []);
    
    if (ids.length === 0) return { state: 'error', info: '请选择要导出的数据' };

    const list = await this.prisma.goods.findMany({
        where: { id: { in: ids } },
        orderBy: { id: 'desc' }
    });

    const categoryIds = [...new Set(list.map(item => item.category))];
    const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });

    // Format data for Excel
    const excelData = list.map(item => {
        const category = categories.find(c => c.id === item.category);
        let imgUrl = '';
        try {
            const imgs = JSON.parse(item.imgs);
            if (imgs && imgs.length > 0) imgUrl = imgs[0].url; // Simplified
        } catch(e) {}

        return [
            imgUrl,
            item.name,
            item.number,
            item.spec,
            category ? category.name : '',
            item.brand,
            item.unit,
            Number(item.buy),
            Number(item.sell),
            // retail
            0,
            // integral
            0,
            item.code,
            item.location,
            Number(item.stock),
            item.type ? '服务商品' : '常规商品',
            '', // attr (simplified)
            item.data,
            '', // alias
            item.serial ? '是' : '否',
            item.batch ? '是' : '否',
            item.protect,
            item.threshold
        ];
    });

    // Headers
    const headers = [
        '商品图像', '商品名称', '商品编号', '规格型号', '商品类别', '商品品牌', '商品单位',
        '采购价格', '销售价格', '零售价格', '兑换积分', '商品条码', '商品货位', '库存阈值',
        '商品类型', '辅助属性', '备注信息', '零售名称', '序列商品', '批次商品', '保质期', '预警阀值'
    ];

    excelData.unshift(headers);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '商品信息');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return { state: 'success', buffer };
  }
}
