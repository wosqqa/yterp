import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class SellService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    try {
      const input = body || {};
      const page = Number(input.page || 1);
      const limit = Number(input.limit || 10);
      if (!page || !limit) return { state: 'error', info: '传入参数不完整!' };

      const where: any = {};
      if (user && user.userId !== 1) where.frame = Number(user.frame);

      if (input.number) where.number = { contains: String(input.number) };
      if (input.customer) where.customer = Number(input.customer);
      if (input.user) where.user = Number(input.user);
      if (input.people) where.people = Number(input.people);
      if (input.examine !== undefined && input.examine !== '') where.examine = Number(input.examine);
      if (input.nucleus !== undefined && input.nucleus !== '') where.nucleus = Number(input.nucleus);
      if (input.cse !== undefined && input.cse !== '') where.cse = Number(input.cse);
      if (input.invoice !== undefined && input.invoice !== '') where.invoice = Number(input.invoice);
      if (input.check !== undefined && input.check !== '') where.check = Number(input.check);
      if (input.data) where.data = { contains: String(input.data) };

      const timeWhere: any = {};
      if (input.startTime) timeWhere.gte = dayjs(input.startTime).startOf('day').unix();
      if (input.endTime) timeWhere.lte = dayjs(input.endTime).endOf('day').unix();
      if (Object.keys(timeWhere).length > 0) where.time = timeWhere;

      if (input.goods) {
        const goodsList = await this.prisma.goods.findMany({
          where: {
            OR: [{ name: { contains: String(input.goods) } }, { py: { contains: String(input.goods) } }],
          },
          select: { id: true },
        });
        const goodsIds = goodsList.map((g) => g.id);
        if (goodsIds.length === 0) {
          where.id = { in: [-1] };
        } else {
          const sellInfos = await this.prisma.sellInfo.findMany({
            where: { goods: { in: goodsIds } },
            select: { pid: true },
          });
          const sellIds = [...new Set(sellInfos.map((i) => Number(i.pid)).filter((v) => v))];
          where.id = { in: sellIds.length > 0 ? sellIds : [-1] };
        }
      }

      const count = await this.prisma.sell.count({ where });
      const list = await this.prisma.sell.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ time: 'desc' }, { id: 'desc' }],
      });

      const sellIds = list.map((r: any) => Number(r.id)).filter((v: number) => v);

      const frameIds = [...new Set(list.map((r: any) => Number(r.frame)).filter((v: number) => v || v === 0))];
      const customerIds = [...new Set(list.map((r: any) => Number(r.customer)).filter((v: number) => v))];
      const peopleIds = [...new Set(list.map((r: any) => Number(r.people)).filter((v: number) => v))];
      const userIds = [...new Set(list.map((r: any) => Number(r.user)).filter((v: number) => v))];

      const [frames, customers, peoples, users] = await Promise.all([
        frameIds.length > 0 ? this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : Promise.resolve([]),
        customerIds.length > 0 ? this.prisma.customer.findMany({ where: { id: { in: customerIds } } }) : Promise.resolve([]),
        peopleIds.length > 0 ? this.prisma.people.findMany({ where: { id: { in: peopleIds } } }) : Promise.resolve([]),
        userIds.length > 0 ? this.prisma.user.findMany({ where: { id: { in: userIds } } }) : Promise.resolve([]),
      ]);

      const [sellBills, invoices, costs, records, sors, sres] = await Promise.all([
        sellIds.length > 0 ? this.prisma.sellBill.findMany({ where: { pid: { in: sellIds } }, orderBy: { id: 'desc' } }) : Promise.resolve([]),
        sellIds.length > 0 ? this.prisma.invoice.findMany({ where: { type: 'sell', class: { in: sellIds } }, orderBy: { id: 'desc' } }) : Promise.resolve([]),
        sellIds.length > 0 ? this.prisma.cost.findMany({ where: { type: 'sell', class: { in: sellIds } }, orderBy: { id: 'desc' } }) : Promise.resolve([]),
        sellIds.length > 0 ? this.prisma.record.findMany({ where: { type: 'sell', source: { in: sellIds } }, orderBy: { id: 'desc' } }) : Promise.resolve([]),
        sellIds.length > 0
          ? this.prisma.sor.findMany({
              where: { id: { in: [...new Set(list.map((r: any) => Number(r.source)).filter((v: number) => v > 0))] } },
              select: { id: true, time: true, number: true },
            })
          : Promise.resolve([]),
        sellIds.length > 0
          ? this.prisma.sre.findMany({
              where: { source: { in: sellIds } },
              select: { id: true, time: true, number: true, source: true },
            })
          : Promise.resolve([]),
      ]);

      const ietIds = [...new Set((costs as any[]).map((c) => Number((c as any).iet)).filter((v) => v))];
      const recordUserIds = [...new Set((records as any[]).map((r) => Number((r as any).user)).filter((v) => v))];
      const [iets, recordUsers] = await Promise.all([
        ietIds.length > 0 ? this.prisma.iet.findMany({ where: { id: { in: ietIds } } }) : Promise.resolve([]),
        recordUserIds.length > 0 ? this.prisma.user.findMany({ where: { id: { in: recordUserIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
      ]);

      const sellBillSourceSellIds = [...new Set((sellBills as any[]).filter((b) => b.type === 'sell').map((b) => Number(b.source)).filter((v) => v))];
      const sellBillSourceBillIds = [...new Set((sellBills as any[]).filter((b) => b.type === 'bill').map((b) => Number(b.source)).filter((v) => v))];
      const [sourceSells, sourceBills] = await Promise.all([
        sellBillSourceSellIds.length > 0 ? this.prisma.sell.findMany({ where: { id: { in: sellBillSourceSellIds } }, select: { id: true, number: true } }) : Promise.resolve([]),
        sellBillSourceBillIds.length > 0 ? this.prisma.bill.findMany({ where: { id: { in: sellBillSourceBillIds } }, select: { id: true, number: true } }) : Promise.resolve([]),
      ]);

      const ietMap = new Map<number, any>((iets as any[]).map((x) => [Number(x.id), x]));
      const recordUserMap = new Map<number, any>((recordUsers as any[]).map((x) => [Number(x.id), x]));
      const sourceSellMap = new Map<number, any>((sourceSells as any[]).map((x) => [Number(x.id), x]));
      const sourceBillMap = new Map<number, any>((sourceBills as any[]).map((x) => [Number(x.id), x]));

      const parseJson = (val: any) => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        if (typeof val !== 'string') return null;
        const s = val.trim();
        if (!s) return null;
        try {
          return JSON.parse(s);
        } catch (e) {
          return null;
        }
      };

      const info = list.map((row: any) => {
        const frameData = (frames as any[]).find((f) => Number(f.id) === Number(row.frame)) || null;
        const customerData = (customers as any[]).find((c) => Number(c.id) === Number(row.customer)) || null;
        const peopleData = (peoples as any[]).find((p) => Number(p.id) === Number(row.people)) || null;
        const userData = (users as any[]).find((u) => Number(u.id) === Number(row.user)) || null;

        const billData = (sellBills as any[])
          .filter((b) => Number(b.pid) === Number(row.id))
          .map((b) => {
            const sourceData =
              b.type === 'sell'
                ? sourceSellMap.get(Number(b.source)) || { id: Number(b.source) || 0, number: '' }
                : sourceBillMap.get(Number(b.source)) || { id: Number(b.source) || 0, number: '' };
            return {
              ...b,
              time: dayjs.unix(Number(b.time)).format('YYYY-MM-DD'),
              money: Number(b.money),
              sourceData,
              extension: { type: b.type === 'sell' ? '销售单' : '核销单' },
            };
          });

        const costData = (costs as any[])
          .filter((c) => Number(c.class) === Number(row.id))
          .map((c) => {
            const stateVal = Number((c as any).state ?? 0);
            return {
              ...c,
              money: Number((c as any).money),
              settle: Number((c as any).settle),
              ietData: ietMap.get(Number((c as any).iet)) || { id: Number((c as any).iet) || 0, name: '' },
              extension: {
                type: '销售单',
                state: [0, 1, 2].includes(stateVal) ? ['未结算', '部分结算', '已结算'][stateVal] : '未结算',
              },
            };
          });

        const invoiceData = (invoices as any[])
          .filter((i) => Number(i.class) === Number(row.id))
          .map((i) => {
            return {
              ...i,
              time: dayjs.unix(Number(i.time)).format('YYYY-MM-DD'),
              money: Number(i.money),
            };
          });

        const recordData = (records as any[])
          .filter((r) => Number(r.source) === Number(row.id))
          .map((r) => {
            return {
              ...r,
              userData: recordUserMap.get(Number((r as any).user)) || { id: Number((r as any).user) || 0, name: '' },
              extension: { time: dayjs.unix(Number((r as any).time)).format('YYYY-MM-DD HH:mm:ss') },
            };
          });

        const relation: any[] = [];
        const sor = (sors as any[]).find((s) => Number(s.id) === Number(row.source));
        if (sor) {
          relation.push({
            type: '销售订单',
            time: dayjs.unix(Number(sor.time)).format('YYYY-MM-DD'),
            number: sor.number,
            sort: Number(sor.time),
            types: 'sor',
            id: sor.id,
          });
        }
        (sres as any[])
          .filter((s) => Number(s.source) === Number(row.id))
          .forEach((s) => {
            relation.push({
              type: '销售退货单',
              time: dayjs.unix(Number(s.time)).format('YYYY-MM-DD'),
              number: s.number,
              sort: Number(s.time),
              types: 'sre',
              id: s.id,
            });
          });
        relation.sort((a, b) => Number(b.sort) - Number(a.sort));

        const logisticsObj: any = parseJson(row.logistics);
        let logisticsText = '';
        if (logisticsObj && typeof logisticsObj === 'object') {
          if (!logisticsObj.key) logisticsText = '';
          else if (logisticsObj.key === 'auto') logisticsText = logisticsObj.number || '';
          else logisticsText = `${logisticsObj.name || ''}|${logisticsObj.number || ''}`;
        }

        const examineVal = Number(row.examine ?? 0);
        const nucleusVal = Number(row.nucleus ?? 0);
        const cseVal = Number(row.cse ?? 0);
        const invoiceVal = Number(row.invoice ?? 0);
        const checkVal = Number(row.check ?? 0);

        const actualVal = Number(row.actual);
        const billAmount = billData.reduce((sum: number, b: any) => sum + Number(b.money || 0), 0);
        const amount = nucleusVal === 0 ? 0 : nucleusVal === 1 ? billAmount : actualVal;

        const extension = {
          logistics: logisticsText,
          examine: [0, 1].includes(examineVal) ? ['未审核', '已审核'][examineVal] : '未审核',
          nucleus: [0, 1, 2].includes(nucleusVal) ? ['未核销', '部分核销', '已核销'][nucleusVal] : '未核销',
          cse: [0, 1, 2, 3].includes(cseVal) ? ['未结算', '部分结算', '已结算', '无需结算'][cseVal] : '未结算',
          invoice: [0, 1, 2, 3].includes(invoiceVal) ? ['未开具', '部分开具', '已开具', '无需开具'][invoiceVal] : '未开具',
          check: [0, 1].includes(checkVal) ? ['未核对', '已核对'][checkVal] : '未核对',
          amount: Number(amount.toFixed(4)),
          anwo: Number((actualVal - amount).toFixed(4)),
        };

        return {
          ...row,
          time: dayjs.unix(Number(row.time)).format('YYYY-MM-DD'),
          total: Number(row.total),
          actual: actualVal,
          money: Number(row.money),
          cost: Number(row.cost),
          frameData,
          customerData,
          peopleData,
          userData,
          billData,
          costData,
          invoiceData,
          recordData,
          relation,
          extension,
        };
      });

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }

  async save(body: any, user: any) {
    try {
      const dataSource = body && body.class ? body.class : body;
      const listSource = body && body.info ? body.info : body && body.list ? body.list : [];
      const costSource = body && body.cost ? body.cost : [];

      const id = Number(dataSource && dataSource.id ? dataSource.id : 0);
      const customer = dataSource && dataSource.customer != null ? Number(dataSource.customer) : 0;
      if (!customer) return { state: 'error', info: '请选择客户!' };
      if (!Array.isArray(listSource) || listSource.length === 0) return { state: 'error', info: '商品信息不可为空!' };

      let timeVal = Math.floor(Date.now() / 1000);
      const time = dataSource && dataSource.time != null ? dataSource.time : null;
      if (time) {
        if (typeof time === 'string' && time.includes('-')) {
          timeVal = Math.floor(new Date(time).getTime() / 1000);
        } else {
          const n = Number(time);
          if (Number.isFinite(n) && n > 0) timeVal = n;
        }
      }

      const period = await this.getPeriod();
      if (timeVal <= period) {
        return { state: 'error', info: '单据日期与结账日期冲突!' };
      }

      const stringify = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        try {
          return JSON.stringify(val);
        } catch (e) {
          return '';
        }
      };

      const toMfd = (val: any) => {
        if (!val) return 0;
        if (val === 0 || val === '0') return 0;
        if (typeof val === 'string' && val.includes('-')) return dayjs(val).startOf('day').unix();
        const n = Number(val);
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
      };

      const sellData: any = {
        frame: user.frame,
        customer,
        people: dataSource && dataSource.people != null ? Number(dataSource.people) : 0,
        account: dataSource && dataSource.account != null ? Number(dataSource.account) : 0,
        time: timeVal,
        number: (dataSource && dataSource.number != null ? String(dataSource.number) : '') || '',
        data: dataSource && dataSource.data != null ? String(dataSource.data) : '',
        logistics: stringify(dataSource && dataSource.logistics),
        file: stringify(dataSource && dataSource.file),
        more: stringify(dataSource && dataSource.more),
        user: user.userId,
        source: dataSource && dataSource.source != null ? Number(dataSource.source) : 0,
      };

      let totalAmount = 0;
      const sellInfos = listSource.map((item: any) => {
        const price = Number(item.price);
        const nums = Number(item.nums);
        const money = (Number.isFinite(price) ? price : 0) * (Number.isFinite(nums) ? nums : 0);
        totalAmount += Number.isFinite(money) ? money : 0;

        return {
          source: item && item.source != null ? Number(item.source) : 0,
          goods: Number(item.goods),
          nums: Number.isFinite(nums) ? nums : 0,
          price: Number.isFinite(price) ? price : 0,
          total: item && item.total != null && item.total !== '' ? Number(item.total) : money,
          unit: item && item.unit != null ? String(item.unit) : '',
          attr: item && item.attr != null ? String(item.attr) : '',
          warehouse: item && item.warehouse != null ? Number(item.warehouse) : 0,
          discount: item && item.discount != null && item.discount !== '' ? Number(item.discount) : 0,
          dsc: item && item.dsc != null && item.dsc !== '' ? Number(item.dsc) : 0,
          tax: item && item.tax != null && item.tax !== '' ? Number(item.tax) : 0,
          tat: item && item.tat != null && item.tat !== '' ? Number(item.tat) : 0,
          tpt: item && item.tpt != null && item.tpt !== '' ? Number(item.tpt) : money,
          data: item && item.data != null ? String(item.data) : '',
          batch: item && item.batch != null ? String(item.batch) : '',
          mfd: toMfd(item && item.mfd),
          serial: stringify(item && item.serial),
          retreat: 0,
        };
      });

      sellData.total = dataSource && dataSource.total != null && dataSource.total !== '' ? Number(dataSource.total) : totalAmount;
      sellData.actual = dataSource && dataSource.actual != null && dataSource.actual !== '' ? Number(dataSource.actual) : sellData.total;
      sellData.money = dataSource && dataSource.money != null && dataSource.money !== '' ? Number(dataSource.money) : 0;
      sellData.cost = dataSource && dataSource.cost != null && dataSource.cost !== '' ? Number(dataSource.cost) : 0;

      if (!sellData.number) {
        const now = dayjs();
        sellData.number = 'XSD' + now.format('YYMMDDHHmmssS');
      }

      const costs = Array.isArray(costSource) ? costSource : [];
      const sellCosts = costs.map((c: any) => {
        return {
          type: 'sell',
          class: 0,
          iet: c && c.iet != null ? Number(c.iet) : 0,
          time: timeVal,
          money: c && c.money != null && c.money !== '' ? Number(c.money) : 0,
          settle: 0,
          state: 0,
          data: c && c.data != null ? String(c.data) : '',
        };
      });

      let sellId = id;
      if (id && id !== 0) {
        const exist = await this.prisma.sell.findUnique({ where: { id } });
        if (!exist) return { state: 'error', info: '数据不存在!' };
        if (user.userId !== 1 && exist.frame !== user.frame) return { state: 'error', info: '无权限操作!' };

        await this.prisma.$transaction(async (prisma) => {
          await prisma.sell.update({
            where: { id },
            data: {
              ...sellData,
              examine: Number((exist as any).examine ?? 0),
              nucleus: Number((exist as any).nucleus ?? 0),
              cse: Number((exist as any).cse ?? (sellData.cost ? 0 : 3)),
              invoice: Number((exist as any).invoice ?? (sellData.actual ? 0 : 3)),
              check: Number((exist as any).check ?? 0),
            },
          });
          await prisma.sellInfo.deleteMany({ where: { pid: id } });
          for (const info of sellInfos) {
            await prisma.sellInfo.create({
              data: { ...info, pid: id, mfd: toMfd((info as any).mfd) },
            });
          }
          await prisma.cost.deleteMany({ where: { type: 'sell', class: id } });
          for (const c of sellCosts) {
            await prisma.cost.create({
              data: { ...c, class: id },
            });
          }
          await prisma.record.create({
            data: { type: 'sell', source: id, time: Math.floor(Date.now() / 1000), user: user.userId, info: '更新单据' },
          });
        });
      } else {
        await this.prisma.$transaction(async (prisma) => {
          const created = await prisma.sell.create({
            data: {
              ...sellData,
              examine: 0,
              nucleus: 0,
              cse: sellData.cost ? 0 : 3,
              invoice: sellData.actual ? 0 : 3,
              check: 0,
            },
          });
          sellId = created.id;
          for (const info of sellInfos) {
            await prisma.sellInfo.create({
              data: { ...info, pid: created.id, mfd: toMfd((info as any).mfd) },
            });
          }
          for (const c of sellCosts) {
            await prisma.cost.create({
              data: { ...c, class: created.id },
            });
          }
          await prisma.record.create({
            data: { type: 'sell', source: created.id, time: Math.floor(Date.now() / 1000), user: user.userId, info: '新增单据' },
          });
        });
      }

      return { state: 'success', info: sellId };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误,操作已撤销!' };
    }
  }
  
  async get(body: any, user: any) {
    try {
      if (body.parm === undefined) {
        return { state: 'error', info: '传入参数不完整!' };
      }

      const parseJsonArray = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val !== 'string') return [];
        const s = val.trim();
        if (!s) return [];
        try {
          const parsed = JSON.parse(s);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      };

      const parseJsonObject = (val: any) => {
        if (val && typeof val === 'object' && !Array.isArray(val)) return val;
        if (typeof val !== 'string') return {};
        const s = val.trim();
        if (!s) return {};
        try {
          const parsed = JSON.parse(s);
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (e) {
          return {};
        }
      };

      const id = Number(body.parm);
      if (!id) {
        return { state: 'error', info: '传入参数不正确!' };
      }

      const classData: any = await this.prisma.sell.findUnique({
        where: { id },
      });

      if (!classData) {
        return { state: 'error', info: '数据不存在!' };
      }
      if (user && user.userId !== 1 && Number(classData.frame) !== Number(user.frame)) {
        return { state: 'error', info: '无权限操作!' };
      }

      const infoList = await this.prisma.sellInfo.findMany({
        where: { pid: id },
        orderBy: { id: 'asc' },
      });

      const goodsIds = [...new Set(infoList.map((item) => item.goods))];
      const warehouseIds = [
        ...new Set(
          infoList
            .map((item) => item.warehouse)
            .filter((wid): wid is number => wid !== null && wid !== 0),
        ),
      ];

      const goodsList =
        goodsIds.length > 0
          ? await this.prisma.goods.findMany({ where: { id: { in: goodsIds } } })
          : [];
      const warehouseList =
        warehouseIds.length > 0
          ? await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } })
          : [];

      const goodsNormalized = goodsList.map((g: any) => {
        return {
          ...g,
          imgs: parseJsonArray(g.imgs),
          units: parseJsonArray(g.units),
          strategy: parseJsonArray(g.strategy),
          more: parseJsonObject(g.more),
          buy: g.buy === undefined ? undefined : Number(g.buy),
          sell: g.sell === undefined ? undefined : Number(g.sell),
          retail: g.retail === undefined ? undefined : Number(g.retail),
          stock: g.stock === undefined ? undefined : Number(g.stock),
          integral: g.integral === undefined ? undefined : Number(g.integral),
          type: g.type === true ? 1 : 0,
        };
      });

      const info = infoList.map((item: any) => {
        const goodsData = goodsNormalized.find((g: any) => g.id === item.goods) || null;
        const warehouseData = warehouseList.find((w) => w.id === item.warehouse) || null;

        let parsedSerial: any[] = [];
        try {
          parsedSerial = parseJsonArray(item.serial);
        } catch (e) {
          parsedSerial = [];
        }

        const imgsList = goodsData ? parseJsonArray((goodsData as any).imgs) : [];

        return {
          ...item,
          price: Number(item.price),
          nums: Number(item.nums),
          discount: Number(item.discount),
          dsc: Number(item.dsc),
          total: Number(item.total),
          tax: Number(item.tax),
          tat: Number(item.tat),
          tpt: Number(item.tpt),
          retreat: Number(item.retreat),
          mfd: item.mfd ? dayjs.unix(Number(item.mfd)).format('YYYY-MM-DD') : '',
          serial: parsedSerial,
          goodsData,
          warehouseData,
          imgs: imgsList[0] || '',
          key: item.goods,
          warehouseId: item.warehouse,
        };
      });

      const cost = await this.prisma.cost.findMany({
        where: { type: 'sell', class: id },
        orderBy: { id: 'asc' },
      });

      let logisticsObj: any = { key: 'auto', name: '自动识别', number: '' };
      try {
        if (classData.logistics) logisticsObj = JSON.parse(classData.logistics as any);
      } catch (e) {}

      const moreObj: any = parseJsonObject(classData.more as any);

      let fileArr: any[] = [];
      try {
        if (classData.file) fileArr = JSON.parse(classData.file as any);
      } catch (e) {}

      const timeStr =
        typeof (classData as any).time === 'number'
          ? dayjs.unix((classData as any).time).format('YYYY-MM-DD')
          : dayjs((classData as any).time).format('YYYY-MM-DD');

      const formattedClass = {
        ...classData,
        time: timeStr,
        total: Number(classData.total),
        actual: Number(classData.actual),
        money: Number(classData.money),
        cost: Number(classData.cost),
        logistics: logisticsObj,
        more: moreObj,
        file: fileArr,
        examine: (classData as any).examine ? 1 : 0,
        nucleus: Number((classData as any).nucleus ?? 0),
        cse: Number((classData as any).cse ?? 0),
        invoice: Number((classData as any).invoice ?? 0),
        check: (classData as any).check ? 1 : 0,
      };

      return { state: 'success', info: { class: formattedClass, info, cost } };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误,操作已撤销!' };
    }
  }

  async del(body: any, user: any) {
    try {
      const ids = body && Array.isArray(body.parm) ? body.parm.map((v: any) => Number(v)).filter((v: number) => v) : [];
      if (ids.length === 0) return { state: 'error', info: '传入参数不完整!' };

      const related = await this.prisma.sre.count({ where: { source: { in: ids } } });
      if (related > 0) return { state: 'error', info: '存在数据关联,删除失败!' };

      const sells = await this.prisma.sell.findMany({ where: { id: { in: ids } } });
      if (user && user.userId !== 1) {
        const denied = sells.find((s: any) => Number(s.frame) !== Number(user.frame));
        if (denied) return { state: 'error', info: '无权限操作!' };
      }
      const examined = sells.find((s: any) => !!(s as any).examine);
      if (examined) return { state: 'error', info: `单据[${(examined as any).number}]已审核,不可删除!` };

      await this.prisma.$transaction(async (prisma) => {
        await prisma.sell.deleteMany({ where: { id: { in: ids } } });
        await prisma.sellInfo.deleteMany({ where: { pid: { in: ids } } });
        await prisma.cost.deleteMany({ where: { type: 'sell', class: { in: ids } } });
        await prisma.record.deleteMany({ where: { type: 'sell', source: { in: ids } } });
      });

      return { state: 'success' };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误,操作已撤销!' };
    }
  }

  async check(body: any, user: any) {
    try {
      const ids = body && Array.isArray(body.parm) ? body.parm.map((v: any) => Number(v)).filter((v: number) => v) : [];
      if (ids.length === 0) return { state: 'error', info: '传入参数不完整!' };

      const period = await this.getPeriod();
      const list = await this.prisma.sell.findMany({ where: { id: { in: ids } } });
      if (user && user.userId !== 1) {
        const denied = (list as any[]).find((s) => Number(s.frame) !== Number(user.frame));
        if (denied) return { state: 'error', info: '无权限操作!' };
      }

      for (const row of list as any[]) {
        if (Number(row.time) <= period) return { state: 'error', info: '操作单据失败,原因:单据日期与结账日期冲突!' };
      }

      await this.prisma.$transaction(async (prisma) => {
        for (const row of list as any[]) {
          const next = Number(row.check ?? 0) === 1 ? 0 : 1;
          await prisma.sell.update({ where: { id: row.id }, data: { check: next } });
          await prisma.record.create({
            data: { type: 'sell', source: row.id, time: Math.floor(Date.now() / 1000), user: user && user.userId ? Number(user.userId) : 0, info: next ? '核对单据' : '反核对单据' },
          });
        }
      });

      return { state: 'success' };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误,操作已撤销!' };
    }
  }

  async examine(body: any, user: any) {
    try {
      const ids = body && Array.isArray(body.parm) ? body.parm.map((v: any) => Number(v)).filter((v: number) => v) : [];
      if (ids.length === 0) return { state: 'error', info: '传入参数不完整!' };

      const period = await this.getPeriod();
      const list = await this.prisma.sell.findMany({ where: { id: { in: ids } } });
      if (user && user.userId !== 1) {
        const denied = (list as any[]).find((s) => Number(s.frame) !== Number(user.frame));
        if (denied) return { state: 'error', info: '无权限操作!' };
      }

      for (const row of list as any[]) {
        if (Number(row.time) <= period) return { state: 'error', info: '操作单据失败,原因:单据日期与结账日期冲突!' };
      }

      await this.prisma.$transaction(async (prisma) => {
        for (const row of list as any[]) {
          const next = Number(row.examine ?? 0) === 1 ? 0 : 1;
          await prisma.sell.update({ where: { id: row.id }, data: { examine: next } });
          await prisma.record.create({
            data: { type: 'sell', source: row.id, time: Math.floor(Date.now() / 1000), user: user && user.userId ? Number(user.userId) : 0, info: next ? '审核单据' : '反审核单据' },
          });
        }
      });

      return { state: 'success' };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误,操作已撤销!' };
    }
  }

  private async getPeriod() {
    const last = await this.prisma.period.findFirst({
      orderBy: { date: 'desc' },
    });
    return last ? Number((last as any).date) : 0;
  }
}
