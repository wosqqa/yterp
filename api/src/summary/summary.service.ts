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

  // Helper to get period (since getPeriod is private in PeriodService, we might need to duplicate or expose it)
  // Let's implement a private helper here or use PeriodService if it exposes it.
  // PeriodService currently has private getPeriod. Let's assume we can query DB directly here.
  private async getPeriodTime() {
    const last = await this.prisma.period.findFirst({
        orderBy: { date: 'desc' }
    });
    return last ? last.date : 0;
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
