import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class SorService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    try {
      const {
        page,
        limit,
        goods,
        number,
        customer,
        people,
        startTime,
        endTime,
        startArrival,
        endArrival,
        user: userId,
        examine,
        state,
        data,
      } = body || {};

      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

      const parts: Prisma.Sql[] = [];
      const toUnixStart = (val: any) => (val ? dayjs(String(val)).startOf('day').unix() : null);
      const toUnixEnd = (val: any) => (val ? dayjs(String(val)).endOf('day').unix() : null);
      const mapEnumDec1 = (val: any, maxUi: number) => {
        if (val === undefined || val === null || val === '') return null;
        const n = Number(val);
        if (!Number.isFinite(n)) return null;
        if (n >= 1 && n <= maxUi) return n - 1;
        if (n >= 0 && n < maxUi) return n;
        return null;
      };

      if (number) parts.push(Prisma.sql`number LIKE ${'%' + String(number) + '%'}`);
      if (customer) parts.push(Prisma.sql`customer = ${Number(customer)}`);
      if (people) parts.push(Prisma.sql`people = ${Number(people)}`);
      if (userId) parts.push(Prisma.sql`user = ${Number(userId)}`);
      if (data) parts.push(Prisma.sql`data LIKE ${'%' + String(data) + '%'}`);

      const ts = toUnixStart(startTime);
      const te = toUnixEnd(endTime);
      if (ts !== null) parts.push(Prisma.sql`time >= ${ts}`);
      if (te !== null) parts.push(Prisma.sql`time <= ${te}`);

      const as = toUnixStart(startArrival);
      const ae = toUnixEnd(endArrival);
      if (as !== null) parts.push(Prisma.sql`arrival >= ${as}`);
      if (ae !== null) parts.push(Prisma.sql`arrival <= ${ae}`);

      const examineVal = mapEnumDec1(examine, 2);
      if (examineVal !== null) parts.push(Prisma.sql`examine = ${examineVal}`);
      const stateVal = mapEnumDec1(state, 4);
      if (stateVal !== null) parts.push(Prisma.sql`state = ${stateVal}`);

      if (user && user.role !== 0 && user.frame !== undefined && user.frame !== null) {
        parts.push(Prisma.sql`frame = ${Number(user.frame)}`);
      }

      if (goods) {
        const goodsList = await this.prisma.goods.findMany({
          where: { OR: [{ name: { contains: String(goods) } }, { py: { contains: String(goods) } }] },
          select: { id: true },
        });
        const goodsIds = goodsList.map((g) => g.id);
        if (goodsIds.length === 0) return { state: 'success', count: 0, info: [] };

        const pidRows: Array<{ pid: number }> = await this.prisma.$queryRaw(
          Prisma.sql`SELECT DISTINCT pid FROM is_sor_info WHERE goods IN (${Prisma.join(goodsIds)})`,
        );
        const pids = pidRows.map((r) => Number(r.pid)).filter((v) => v);
        if (pids.length === 0) return { state: 'success', count: 0, info: [] };
        parts.push(Prisma.sql`id IN (${Prisma.join(pids)})`);
      }

      const whereClause = parts.length > 0 ? Prisma.sql`WHERE ${Prisma.join(parts, ' AND ')}` : Prisma.sql``;

      const countRows: Array<{ count: any }> = await this.prisma.$queryRaw(Prisma.sql`SELECT COUNT(*) as count FROM is_sor ${whereClause}`);
      const count = countRows && countRows[0] ? Number(countRows[0].count) : 0;

      const offset = (Number(page) - 1) * Number(limit);
      const take = Number(limit);
      const list: any[] = await this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM is_sor ${whereClause} ORDER BY time DESC, id DESC LIMIT ${offset}, ${take}`,
      );

      if (list.length === 0) return { state: 'success', count, info: [] };

      const ids = list.map((r) => Number(r.id));
      const frameIds = [...new Set(list.map((r) => Number(r.frame)).filter((v) => v || v === 0))];
      const customerIds = [...new Set(list.map((r) => Number(r.customer)).filter((v) => v))];
      const peopleIds = [...new Set(list.map((r) => Number(r.people)).filter((v) => v))];
      const makerIds = [...new Set(list.map((r) => Number(r.user)).filter((v) => v))];

      const frames = frameIds.length > 0 ? await this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : [];
      const customers = customerIds.length > 0 ? await this.prisma.customer.findMany({ where: { id: { in: customerIds } } }) : [];
      const peoples = peopleIds.length > 0 ? await this.prisma.people.findMany({ where: { id: { in: peopleIds } } }) : [];
      const users = makerIds.length > 0 ? await this.prisma.user.findMany({ where: { id: { in: makerIds } } }) : [];

      const borRows: any[] = await this.prisma.$queryRaw(
        Prisma.sql`SELECT id, source, time, number FROM is_bor WHERE source IN (${Prisma.join(ids)})`,
      );
      const sellRows: any[] = await this.prisma.$queryRaw(
        Prisma.sql`SELECT id, source, time, number FROM is_sell WHERE source IN (${Prisma.join(ids)})`,
      );

      const relationMap = new Map<number, any[]>();
      borRows.forEach((b) => {
        const sid = Number(b.source);
        if (!relationMap.has(sid)) relationMap.set(sid, []);
        relationMap.get(sid)!.push({
          type: '采购订单',
          time: dayjs.unix(Number(b.time)).format('YYYY-MM-DD'),
          number: b.number,
          sort: Number(b.time),
          types: 'bor',
          id: Number(b.id),
        });
      });
      sellRows.forEach((s) => {
        const sid = Number(s.source);
        if (!relationMap.has(sid)) relationMap.set(sid, []);
        relationMap.get(sid)!.push({
          type: '销售单',
          time: dayjs.unix(Number(s.time)).format('YYYY-MM-DD'),
          number: s.number,
          sort: Number(s.time),
          types: 'sell',
          id: Number(s.id),
        });
      });
      relationMap.forEach((arr) => arr.sort((a, b) => b.sort - a.sort));

      const recordRows: any[] = await this.prisma.$queryRaw(
        Prisma.sql`SELECT id, source, time, user, info FROM is_record WHERE type='sor' AND source IN (${Prisma.join(ids)}) ORDER BY id DESC`,
      );
      const recordUserIds = [...new Set(recordRows.map((r) => Number(r.user)).filter((v) => v))];
      const recordUsers = recordUserIds.length > 0 ? await this.prisma.user.findMany({ where: { id: { in: recordUserIds } } }) : [];
      const recordMap = new Map<number, any[]>();
      recordRows.forEach((r) => {
        const sid = Number(r.source);
        if (!recordMap.has(sid)) recordMap.set(sid, []);
        recordMap.get(sid)!.push({
          id: Number(r.id),
          source: sid,
          time: Number(r.time),
          user: Number(r.user),
          info: r.info,
          extension: { time: dayjs.unix(Number(r.time)).format('YYYY-MM-DD HH:mm:ss') },
          userData: recordUsers.find((u) => u.id === Number(r.user)) || null,
        });
      });

      const info = list.map((r) => {
        const idVal = Number(r.id);
        const examineVal = Number(r.examine);
        const stateVal = Number(r.state);
        return {
          id: idVal,
          frame: Number(r.frame),
          customer: Number(r.customer),
          people: Number(r.people),
          user: Number(r.user),
          time: dayjs.unix(Number(r.time)).format('YYYY-MM-DD'),
          number: r.number,
          total: Number(r.total),
          actual: Number(r.actual),
          arrival: Number(r.arrival) ? dayjs.unix(Number(r.arrival)).format('YYYY-MM-DD') : '',
          logistics: r.logistics,
          file: r.file,
          data: r.data || '',
          more: r.more,
          examine: examineVal,
          state: stateVal,
          frameData: frames.find((f) => f.id === Number(r.frame)) || null,
          customerData: customers.find((c) => c.id === Number(r.customer)) || null,
          peopleData: peoples.find((p) => p.id === Number(r.people)) || null,
          userData: users.find((u) => u.id === Number(r.user)) || null,
          recordData: recordMap.get(idVal) || [],
          relation: relationMap.get(idVal) || [],
          extension: {
            examine: examineVal === 1 ? '已审核' : '未审核',
            state: stateVal === 0 ? '未出库' : stateVal === 1 ? '部分出库' : stateVal === 2 ? '已出库' : '关闭',
          },
        };
      });

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }

  async get(body: any, user: any) {
    try {
      const { parm } = body || {};
      if (!parm) return { state: 'error', info: '传入参数不完整!' };

      const id = Number(parm);
      const rows: any[] = await this.prisma.$queryRaw(Prisma.sql`SELECT * FROM is_sor WHERE id=${id} LIMIT 1`);
      if (!rows || rows.length === 0) return { state: 'error', info: '数据不存在!' };

      const row = rows[0];
      if (user && user.role !== 0 && user.frame !== undefined && user.frame !== null && Number(row.frame) !== Number(user.frame)) {
        return { state: 'error', info: '无权限访问!' };
      }

      const safeParse = (val: any, fallback: any) => {
        if (val === null || val === undefined || val === '') return fallback;
        if (typeof val === 'object') return val;
        try {
          return JSON.parse(String(val));
        } catch (e) {
          return fallback;
        }
      };

      const classData: any = {
        ...row,
        time: dayjs.unix(Number(row.time)).format('YYYY-MM-DD'),
        arrival: Number(row.arrival) ? dayjs.unix(Number(row.arrival)).format('YYYY-MM-DD') : '',
        logistics: safeParse(row.logistics, []),
        file: safeParse(row.file, []),
        more: safeParse(row.more, {}),
      };

      const infoRows: any[] = await this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM is_sor_info WHERE pid=${id} ORDER BY id ASC`,
      );

      const goodsIds = [...new Set(infoRows.map((i) => Number(i.goods)).filter((v) => v))];
      const warehouseIds = [...new Set(infoRows.map((i) => Number(i.warehouse)).filter((v) => v || v === 0))];

      const goodsList = goodsIds.length > 0 ? await this.prisma.goods.findMany({ where: { id: { in: goodsIds } } }) : [];
      const warehouseList =
        warehouseIds.length > 0 ? await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } }) : [];

      const normalizeGoods = (g: any) => {
        const imgs = safeParse(g.imgs, []);
        const units = safeParse(g.units, []);
        const strategy = safeParse(g.strategy, []);
        const more = safeParse(g.more, {});
        return {
          ...g,
          imgs,
          units,
          strategy,
          more,
          extension: {
            unit: g.unit === '-1' ? '多单位' : g.unit,
            type: g.type ? '服务商品' : '常规商品',
          },
        };
      };

      const info = infoRows.map((i) => {
        const goodsData = goodsList.find((g) => g.id === Number(i.goods));
        const warehouseData = warehouseList.find((w) => w.id === Number(i.warehouse));
        return {
          id: Number(i.id),
          pid: Number(i.pid),
          goods: Number(i.goods),
          attr: i.attr || '',
          unit: i.unit || '',
          warehouse: i.warehouse != null ? Number(i.warehouse) : 0,
          price: Number(i.price),
          nums: Number(i.nums),
          handle: Number(i.handle),
          discount: Number(i.discount),
          dsc: Number(i.dsc),
          total: Number(i.total),
          tax: Number(i.tax),
          tat: Number(i.tat),
          tpt: Number(i.tpt),
          data: i.data || '',
          goodsData: goodsData ? normalizeGoods(goodsData) : null,
          warehouseData: warehouseData || null,
        };
      });

      return { state: 'success', info: { class: classData, info } };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }

  async save(body: any, user: any) {
    try {
      const dataSource = body && body.class ? body.class : body;
      const listSource = body && body.info ? body.info : body && body.list ? body.list : [];

      const { id, customer, time, number, people, arrival, delivery, logistics, file, data, more } = dataSource || {};

      if (!customer) return { state: 'error', info: '请选择客户!' };
      if (!time) return { state: 'error', info: '请选择单据日期!' };
      if (!number) return { state: 'error', info: '请输入单据编号!' };
      if (!Array.isArray(listSource) || listSource.length === 0) return { state: 'error', info: '商品信息不可为空!' };

      let timeVal = Math.floor(Date.now() / 1000);
      if (time) {
        if (typeof time === 'string' && time.includes('-')) {
          timeVal = Math.floor(new Date(time).getTime() / 1000);
        } else {
          timeVal = Number(time);
        }
      }

      const toTime = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'string' && val.includes('-')) return Math.floor(new Date(val).getTime() / 1000);
        return Number(val) || 0;
      };

      const arrivalVal = toTime(delivery || arrival);

      const sorInfos = listSource.map((item: any) => {
        const money = Number(item.price) * Number(item.nums);
        const dsc = item.dsc != null ? Number(item.dsc) : 0;
        const total = item.total != null ? Number(item.total) : Number((money - dsc).toFixed(4));
        const tat = item.tat != null ? Number(item.tat) : 0;
        const tpt = item.tpt != null ? Number(item.tpt) : Number((total + tat).toFixed(4));
        return {
          goods: Number(item.goods),
          attr: item.attr || '',
          unit: item.unit || '',
          warehouse: item.warehouse != null ? Number(item.warehouse) : 0,
          price: Number(item.price),
          nums: Number(item.nums),
          handle: 0,
          discount: item.discount != null ? Number(item.discount) : 0,
          dsc,
          total,
          tax: item.tax != null ? Number(item.tax) : 0,
          tat,
          tpt,
          data: item.data || '',
        };
      });

      const totalAmount = sorInfos.reduce((sum, r) => sum + Number(r.tpt), 0);
      const actualAmount = dataSource.actual != null && dataSource.actual !== '' ? Number(dataSource.actual) : totalAmount;
      if (actualAmount > totalAmount) return { state: 'error', info: '实际金额不可大于单据金额!' };

      const sorData: any = {
        frame: user && user.frame != null ? Number(user.frame) : 0,
        customer: Number(customer),
        time: timeVal,
        number: String(number),
        total: totalAmount,
        actual: actualAmount,
        people: people ? Number(people) : 0,
        arrival: arrivalVal,
        logistics: logistics ? (typeof logistics === 'object' ? JSON.stringify(logistics) : String(logistics)) : '',
        file: file ? (typeof file === 'object' ? JSON.stringify(file) : String(file)) : '',
        data: data || '',
        more: more ? (typeof more === 'object' ? JSON.stringify(more) : String(more)) : '',
        examine: false,
        state: dataSource.state != null ? Number(dataSource.state) : 0,
        user: user && user.userId != null ? Number(user.userId) : 0,
      };

      const now = Math.floor(Date.now() / 1000);

      if (id && Number(id) !== 0) {
        await this.prisma.$transaction(async (tx) => {
          await tx.$executeRaw(
            Prisma.sql`UPDATE is_sor SET frame=${sorData.frame}, customer=${sorData.customer}, time=${sorData.time}, number=${sorData.number}, total=${sorData.total}, actual=${sorData.actual}, people=${sorData.people}, arrival=${sorData.arrival}, logistics=${sorData.logistics}, file=${sorData.file}, data=${sorData.data}, more=${sorData.more}, examine=${sorData.examine ? 1 : 0}, state=${sorData.state}, user=${sorData.user} WHERE id=${Number(id)}`,
          );

          await tx.$executeRaw(Prisma.sql`DELETE FROM is_sor_info WHERE pid=${Number(id)}`);
          const values = sorInfos.map(
            (info) =>
              Prisma.sql`(${Number(id)}, ${info.goods}, ${info.attr}, ${info.unit}, ${info.warehouse}, ${info.price}, ${info.nums}, ${info.discount}, ${info.dsc}, ${info.total}, ${info.tax}, ${info.tat}, ${info.tpt}, ${info.data}, 0)`,
          );
          await tx.$executeRaw(
            Prisma.sql`INSERT INTO is_sor_info (pid, goods, attr, unit, warehouse, price, nums, discount, dsc, total, tax, tat, tpt, data, handle) VALUES ${Prisma.join(values, ',')}`,
          );

          await tx.record.create({ data: { type: 'sor', source: Number(id), time: now, user: sorData.user, info: '更新单据' } });
        }, { maxWait: 60000, timeout: 60000 });
        return { state: 'success', info: Number(id) };
      }

      const created = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`INSERT INTO is_sor (frame, customer, time, number, total, actual, people, arrival, logistics, file, data, more, examine, state, user)
          VALUES (${sorData.frame}, ${sorData.customer}, ${sorData.time}, ${sorData.number}, ${sorData.total}, ${sorData.actual}, ${sorData.people}, ${sorData.arrival}, ${sorData.logistics}, ${sorData.file}, ${sorData.data}, ${sorData.more}, ${0}, ${0}, ${sorData.user})`,
        );

        const inserted: any[] = await tx.$queryRaw(Prisma.sql`SELECT LAST_INSERT_ID() as id`);
        const newId = inserted && inserted[0] ? Number(inserted[0].id) : 0;
        if (!newId) throw new Error('新增单据失败');

        const values = sorInfos.map(
          (info) =>
            Prisma.sql`(${newId}, ${info.goods}, ${info.attr}, ${info.unit}, ${info.warehouse}, ${info.price}, ${info.nums}, ${info.discount}, ${info.dsc}, ${info.total}, ${info.tax}, ${info.tat}, ${info.tpt}, ${info.data}, 0)`,
        );
        await tx.$executeRaw(
          Prisma.sql`INSERT INTO is_sor_info (pid, goods, attr, unit, warehouse, price, nums, discount, dsc, total, tax, tat, tpt, data, handle) VALUES ${Prisma.join(values, ',')}`,
        );
        await tx.record.create({ data: { type: 'sor', source: newId, time: now, user: sorData.user, info: '新增单据' } });
        return { id: newId };
      }, { maxWait: 60000, timeout: 60000 });

      return { state: 'success', info: created.id };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }
}
