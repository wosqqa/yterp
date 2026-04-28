"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const period_service_1 = require("../period/period.service");
const sys_service_1 = require("../sys/sys.service");
let SummaryService = class SummaryService {
    prisma;
    periodService;
    sysService;
    constructor(prisma, periodService, sysService) {
        this.prisma = prisma;
        this.periodService = periodService;
        this.sysService = sysService;
    }
    async getPeriodTime() {
        const last = await this.prisma.period.findFirst({
            orderBy: { date: 'desc' }
        });
        return last ? last.date : 0;
    }
    async init() {
        const period = await this.getPeriodTime();
        const count = await this.prisma.roomInfo.count({
            where: { time: { gt: period } }
        });
        const sys = await this.sysService.getSys(['fun']);
        const fun = sys['fun'] || {};
        const valuationMap = { base: '基础计价', ma: '移动平均', fifo: '先进先出' };
        const branchMap = ['总仓核算', '分仓核算'];
        const ruleMap = { def: '结存结余', attr: '辅助属性', batch: '批次日期', aab: '属性批次' };
        const info = {
            valuation: valuationMap[fun['valuation']] || '未知',
            branch: branchMap[fun['branch']] || '未知',
            rule: ruleMap[fun['rule']] || '未知'
        };
        const summaries = await this.prisma.summary.findMany({
            where: { time: { gt: period } },
            select: { id: true }
        });
        const summaryIds = summaries.map(s => s.id);
        if (summaryIds.length > 0) {
            const fifos = await this.prisma.fifo.findMany({
                where: { out: { in: summaryIds } }
            });
            const relation = fifos.map(f => ({ id: f.in, handle: f.handle }));
            const restoreMap = {};
            for (const r of relation) {
                restoreMap[r.id] = (restoreMap[r.id] || 0) + Number(r.handle);
            }
            const updatePromises = [];
            for (const [id, handle] of Object.entries(restoreMap)) {
                updatePromises.push(this.prisma.summary.update({
                    where: { id: Number(id) },
                    data: { handle: { decrement: handle } }
                }));
            }
            const fifoIds = fifos.map(f => f.id);
            if (fifoIds.length > 0) {
                updatePromises.push(this.prisma.fifo.deleteMany({ where: { id: { in: fifoIds } } }));
            }
            updatePromises.push(this.prisma.summary.deleteMany({ where: { id: { in: summaryIds } } }));
            try {
                await this.prisma.$transaction(updatePromises);
            }
            catch (e) {
                console.error('Summary init error', e);
            }
        }
        return {
            state: 'success',
            count,
            info
        };
    }
};
exports.SummaryService = SummaryService;
exports.SummaryService = SummaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        period_service_1.PeriodService,
        sys_service_1.SysService])
], SummaryService);
//# sourceMappingURL=summary.service.js.map