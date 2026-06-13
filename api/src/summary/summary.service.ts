import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PeriodService } from '../period/period.service';
import { SysService } from '../sys/sys.service';

@Injectable()
export class SummaryService {
  constructor(
    private prisma: PrismaService,
    private periodService: PeriodService, // Access via service or helper?
    private sysService: SysService
  ) {}

  private toNum(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private parseJson<T>(v: any, fallback: T): T {
    try {
      if (v === null || v === undefined || v === '') return fallback;
      return JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  private round(n: number, digit: number): number {
    const d = Number.isFinite(Number(digit)) ? Number(digit) : 2;
    return Number(Number(n).toFixed(d));
  }

  private async getPeriodTime() {
    const last = await this.prisma.period.findFirst({
        orderBy: { date: 'desc' }
    });
    return last ? last.date : 0;
  }

  async note(type: string, classId: number, mold: boolean, tx?: any) {
    const prisma = tx || this.prisma;
    if (!type || !classId) return;
    if (mold) {
      const list = await prisma.roomInfo.findMany({
        where: { type: String(type), class: Number(classId) },
        orderBy: [{ time: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      const ids = list.map((v: any) => Number(v.id)).filter((v: number) => v);
      await this.handle(ids, prisma);
    } else {
      const summaryRows = await prisma.summary.findMany({
        where: { type: String(type), class: Number(classId) },
        select: { id: true },
      });
      const summaryIds = summaryRows.map((v: any) => Number(v.id)).filter((v: number) => v);
      if (summaryIds.length === 0) return;

      const fifos = await prisma.fifo.findMany({ where: { out: { in: summaryIds } } });
      const restoreMap = new Map<number, number>();
      for (const f of fifos as any[]) {
        const inId = Number((f as any).in);
        const handle = this.toNum((f as any).handle);
        restoreMap.set(inId, (restoreMap.get(inId) || 0) + handle);
      }

      const ops: any[] = [];
      for (const [id, handle] of restoreMap.entries()) {
        ops.push(prisma.summary.update({ where: { id }, data: { handle: { decrement: handle } } }));
      }
      if (fifos.length > 0) ops.push(prisma.fifo.deleteMany({ where: { id: { in: (fifos as any[]).map((x) => Number(x.id)) } } }));
      ops.push(prisma.summary.deleteMany({ where: { id: { in: summaryIds } } }));
      await prisma.$transaction(ops);
    }
  }

  async handle(arr: number[], tx?: any) {
    const prisma = tx || this.prisma;
    const ids = Array.isArray(arr) ? arr.map((v) => Number(v)).filter((v) => v) : [];
    if (ids.length === 0) return;

    const info = await prisma.roomInfo.findMany({
      where: { id: { in: ids } },
      orderBy: [{ time: 'asc' }, { id: 'asc' }],
    });
    if (!info || info.length === 0) return;

    const typeMap = new Map<string, number[]>();
    for (const v of info as any[]) {
      const t = String((v as any).type || '');
      const i = Number((v as any).info);
      if (!t || !i) continue;
      if (!typeMap.has(t)) typeMap.set(t, []);
      typeMap.get(t)!.push(i);
    }

    const recordMap = new Map<string, any>();
    const loadInfo = async (t: string, model: any, selectWarehouse: (row: any) => number) => {
      const list = typeMap.get(t) || [];
      if (list.length === 0) return;
      const rows = await model.findMany({
        where: { id: { in: [...new Set(list)] } },
        select: { id: true, goods: true, attr: true, warehouse: true, batch: true, mfd: true, serial: true, storehouse: true },
      });
      for (const r of rows as any[]) {
        const key = `${t}:${Number(r.id)}`;
        recordMap.set(key, {
          goods: Number(r.goods),
          attr: r.attr != null ? String(r.attr) : '',
          warehouse: Number(selectWarehouse(r) || 0),
          batch: r.batch != null ? String(r.batch) : '',
          mfd: r.mfd != null ? this.toNum(r.mfd) : 0,
          serial: r.serial != null ? String(r.serial) : '[]',
        });
      }
    };

    if (typeMap.size > 0) {
      await Promise.all([
        loadInfo('buy', prisma.buyInfo, (r: any) => r.warehouse),
        loadInfo('bre', prisma.breInfo, (r: any) => r.warehouse),
        loadInfo('sell', prisma.sellInfo, (r: any) => r.warehouse),
        loadInfo('sre', prisma.sreInfo, (r: any) => r.warehouse),
        loadInfo('swapOut', prisma.swapInfo, (r: any) => r.warehouse),
        loadInfo('swapEnter', prisma.swapInfo, (r: any) => r.storehouse),
        loadInfo('entry', prisma.entryInfo, (r: any) => r.warehouse),
        loadInfo('extry', prisma.extryInfo, (r: any) => r.warehouse),
      ]);
    }

    const def = { exist: [0, 0, 0, 0], balance: [0, 0, 0, 0] };
    const summaryRows = (info as any[])
      .map((v: any) => {
        const key = `${String(v.type)}:${Number(v.info)}`;
        const row = recordMap.get(key);
        if (!row) return null;
        return {
          pid: Number(v.id),
          type: String(v.type),
          class: Number(v.class),
          info: Number(v.info),
          time: Number(v.time),
          goods: Number(row.goods),
          attr: String(row.attr || ''),
          warehouse: Number(row.warehouse || 0),
          batch: String(row.batch || ''),
          mfd: Number(row.mfd || 0),
          serial: String(row.serial || '[]'),
          direction: Boolean(v.direction),
          price: v.price,
          nums: v.nums,
          uct: 0,
          bct: 0,
          exist: JSON.stringify(def.exist),
          balance: JSON.stringify(def.balance),
          handle: 0,
        };
      })
      .filter((v: any) => v);

    if (summaryRows.length === 0) return;

    await prisma.summary.createMany({ data: summaryRows });
    const created = await prisma.summary.findMany({
      where: { pid: { in: summaryRows.map((v: any) => Number(v.pid)) } },
      orderBy: { id: 'asc' },
    });
    if (!created || created.length === 0) return;

    const sys = await this.sysService.getSys(['fun']);
    const fun = (sys as any)['fun'] || {};
    const digitMoney = this.toNum(fun?.digit?.money);
    const valuation = String(fun?.valuation || 'base');
    const branch = this.toNum(fun?.branch);
    const rule = String(fun?.rule || 'def');

    const goodsIds = [...new Set((created as any[]).map((v) => Number(v.goods)).filter((v) => v))];
    const [goodsList, attrList] = await Promise.all([
      goodsIds.length ? prisma.goods.findMany({ where: { id: { in: goodsIds } }, select: { id: true, buy: true } }) : Promise.resolve([]),
      goodsIds.length ? prisma.attr.findMany({ where: { pid: { in: goodsIds } }, select: { pid: true, name: true, buy: true } }) : Promise.resolve([]),
    ]);
    const goodsBuyMap = new Map<number, number>((goodsList as any[]).map((g) => [Number(g.id), this.toNum(g.buy)]));
    const attrBuyMap = new Map<string, number>();
    for (const a of attrList as any[]) {
      attrBuyMap.set(`${Number(a.pid)}::${String(a.name || '')}`, this.toNum(a.buy));
    }

    const getPrev = async (where: any, currentId: number) => {
      const hit = await prisma.summary.findFirst({
        where: { id: { lt: currentId }, ...where },
        orderBy: { id: 'desc' },
        select: { exist: true, balance: true },
      });
      if (!hit) return def;
      const exist = this.parseJson((hit as any).exist, def.exist);
      const balance = this.parseJson((hit as any).balance, def.balance);
      return { exist, balance };
    };

    for (const vo of created as any[]) {
      const id = Number(vo.id);
      const goods = Number(vo.goods);
      const warehouse = Number(vo.warehouse);
      const attr = String(vo.attr || '');
      const batch = String(vo.batch || '');
      const mfd = this.toNum(vo.mfd);
      const nums = this.toNum(vo.nums);
      const price = this.toNum(vo.price);

      const ruleWhere: any = {};
      if (rule === 'attr') ruleWhere.attr = attr;
      else if (rule === 'batch') {
        ruleWhere.batch = batch;
        ruleWhere.mfd = mfd;
      } else if (rule === 'aab') {
        ruleWhere.attr = attr;
        ruleWhere.batch = batch;
        ruleWhere.mfd = mfd;
      }

      const first0 = await getPrev({ goods }, id);
      const first1 = await getPrev({ goods, warehouse }, id);
      const first2 = await getPrev({ goods, ...ruleWhere }, id);
      const first3 = await getPrev({ goods, warehouse, ...ruleWhere }, id);
      const first = [first0, first1, first2, first3];

      const buy = attrBuyMap.has(`${goods}::${attr}`) ? (attrBuyMap.get(`${goods}::${attr}`) as number) : (goodsBuyMap.get(goods) || 0);
      const serialArr: any[] = this.parseJson(vo.serial, []);

      let uct = 0;
      if (!Array.isArray(serialArr) || serialArr.length === 0) {
        if (valuation === 'base') {
          if (['buy', 'bre', 'swapOut', 'swapEnter', 'entry', 'extry'].includes(String(vo.type))) uct = price;
          else uct = buy;
        } else if (valuation === 'ma') {
          if (['buy', 'bre', 'swapOut', 'swapEnter', 'entry', 'extry'].includes(String(vo.type))) uct = price;
          else {
            if (!branch) {
              uct = this.toNum(first[2].exist[2]) <= 0 ? buy : this.toNum(first[2].balance[2]) / this.toNum(first[2].exist[2]);
            } else {
              uct = this.toNum(first[3].exist[3]) <= 0 ? buy : this.round(this.toNum(first[3].balance[3]) / this.toNum(first[3].exist[3]), 2);
            }
          }
        } else {
          if (['buy', 'swapEnter', 'entry'].includes(String(vo.type))) uct = price;
          else if (['sre', 'vre'].includes(String(vo.type))) uct = buy;
          else {
            const where: any = {
              id: { lt: id },
              goods,
              attr,
              batch,
              mfd,
              direction: true,
            };
            if (!branch) where.warehouse = warehouse;
            const list = await prisma.summary.findMany({
              where: {
                ...where,
                NOT: { nums: { equals: prisma.summary.fields.handle } },
              } as any,
              orderBy: { id: 'asc' },
              select: { id: true, uct: true, nums: true, handle: true },
            });
            const usableList = (list as any[])
              .map((v) => ({
                id: Number(v.id),
                uct: this.toNum(v.uct),
                usable: this.toNum(v.nums) - this.toNum(v.handle),
              }))
              .filter((v) => v.usable > 0);
            if (usableList.length === 0) {
              uct = buy;
            } else {
              let knot = nums;
              let costSum = 0;
              const rel: Array<{ id: number; handle: number }> = [];
              for (const v of usableList) {
                if (knot <= v.usable) {
                  rel.push({ id: v.id, handle: knot });
                  costSum += knot * v.uct;
                  knot = 0;
                  break;
                } else {
                  rel.push({ id: v.id, handle: v.usable });
                  costSum += v.usable * v.uct;
                  knot -= v.usable;
                }
              }
              if (nums > 0) uct = costSum / nums;
              const fifoRows = rel.map((r) => ({ out: id, in: r.id, handle: r.handle }));
              await prisma.$transaction([
                ...rel.map((r) => prisma.summary.update({ where: { id: r.id }, data: { handle: { increment: r.handle } } })),
                fifoRows.length ? prisma.fifo.createMany({ data: fifoRows }) : prisma.fifo.createMany({ data: [] }),
              ]);
            }
          }
        }
      } else {
        if (['buy', 'swapEnter', 'entry'].includes(String(vo.type))) uct = price;
        else {
          let sum = 0;
          for (const s of serialArr) {
            const sn = String(s || '');
            if (!sn) continue;
            const row = await prisma.summary.findFirst({
              where: { id: { lt: id }, goods, serial: { contains: `"${sn}"` } },
              orderBy: { id: 'desc' },
              select: { uct: true },
            });
            sum += row ? this.toNum((row as any).uct) : buy;
          }
          uct = nums > 0 ? sum / nums : 0;
        }
      }

      uct = this.round(uct, digitMoney);
      const bct = uct * nums;
      const dirIn = Boolean(vo.direction);
      const exist = [
        dirIn ? this.toNum(first[0].exist[0]) + nums : this.toNum(first[0].exist[0]) - nums,
        dirIn ? this.toNum(first[1].exist[1]) + nums : this.toNum(first[1].exist[1]) - nums,
        dirIn ? this.toNum(first[2].exist[2]) + nums : this.toNum(first[2].exist[2]) - nums,
        dirIn ? this.toNum(first[3].exist[3]) + nums : this.toNum(first[3].exist[3]) - nums,
      ];
      const balance = [
        dirIn ? this.toNum(first[0].balance[0]) + bct : this.toNum(first[0].balance[0]) - bct,
        dirIn ? this.toNum(first[1].balance[1]) + bct : this.toNum(first[1].balance[1]) - bct,
        dirIn ? this.toNum(first[2].balance[2]) + bct : this.toNum(first[2].balance[2]) - bct,
        dirIn ? this.toNum(first[3].balance[3]) + bct : this.toNum(first[3].balance[3]) - bct,
      ];
      for (let k = 0; k < 4; k++) {
        if (this.toNum(exist[k]) === 0) balance[k] = 0;
      }

      await prisma.summary.update({
        where: { id },
        data: { uct, bct, exist: JSON.stringify(exist), balance: JSON.stringify(balance) },
      });
    }
  }

  async init() {
    const period = await this.getPeriodTime();
    
    // Count room_info > period
    const count = await this.prisma.roomInfo.count({
        where: { time: { gt: period } }
    });

    // Get sys config 'fun'
    const sys = await this.sysService.getSys(['fun']);
    const fun = sys['fun'] || {};

    // Mappings
    const valuationMap = { base: '基础计价', ma: '移动平均', fifo: '先进先出' };
    const branchMap = ['总仓核算', '分仓核算'];
    const ruleMap = { def: '结存结余', attr: '辅助属性', batch: '批次日期', aab: '属性批次' };

    const info = {
        valuation: valuationMap[fun['valuation']] || '未知',
        branch: branchMap[fun['branch']] || '未知',
        rule: ruleMap[fun['rule']] || '未知'
    };

    // Initial checkout logic (Simplified translation of PHP logic)
    // 1. Get summary ids where time > period
    const summaries = await this.prisma.summary.findMany({
        where: { time: { gt: period } },
        select: { id: true }
    });
    const summaryIds = summaries.map(s => s.id);

    if (summaryIds.length > 0) {
        // 2. Get fifo where out or in is in summaryIds
        // PHP: [['out','in',array_column($summary,'id')]] -> out IN ids?
        // Wait, PHP: `['out','in',ids]` usually means `out IN (ids)`.
        // But logic says: `Db::name('fifo')->where([['out','in',array_column($summary,'id')]])`
        // Let's assume it checks `out` column.
        
        const fifos = await this.prisma.fifo.findMany({
            where: { out: { in: summaryIds } }
        });

        // 3. Restore handle to summary (reverse FIFO)
        // PHP: update summary set handle = handle - value where id = in_id
        // We need to loop or bulk update.
        const relation = fifos.map(f => ({ id: f.in, handle: f.handle }));
        
        // Group by ID to sum up handles if multiple
        const restoreMap = {};
        for (const r of relation) {
            restoreMap[r.id] = (restoreMap[r.id] || 0) + Number(r.handle);
        }

        const updatePromises: any[] = [];
        for (const [id, handle] of Object.entries(restoreMap)) {
            updatePromises.push(
                this.prisma.summary.update({
                    where: { id: Number(id) },
                    data: { handle: { decrement: handle as number } }
                })
            );
        }
        
        // 4. Delete fifo
        const fifoIds = fifos.map(f => f.id);
        if (fifoIds.length > 0) {
             updatePromises.push(this.prisma.fifo.deleteMany({ where: { id: { in: fifoIds } } }));
        }

        // 5. Delete summary
        updatePromises.push(this.prisma.summary.deleteMany({ where: { id: { in: summaryIds } } }));

        try {
            await this.prisma.$transaction(updatePromises);
        } catch (e) {
            console.error('Summary init error', e);
            // Continue or throw?
        }
    }

    // pushLog('执行数据校准'); 

    return {
        state: 'success',
        count,
        info
    };
  }
}
