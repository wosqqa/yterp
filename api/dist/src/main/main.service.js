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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dayjs_1 = __importDefault(require("dayjs"));
let MainService = class MainService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(user) {
        const dayTime = (0, dayjs_1.default)().startOf('day').unix();
        const group = {
            today: {},
            yesterday: {},
        };
        const frameFilter = user.role === 0 ? {} : { frame: user.frame };
        const commonWhere = {
            ...frameFilter,
            examine: true,
        };
        for (const v of ['today', 'yesterday']) {
            const startTime = v === 'today' ? dayTime : dayTime - 86400;
            const endTime = v === 'today' ? dayTime + 86400 : dayTime;
            const timeWhere = {
                time: {
                    gte: startTime,
                    lt: endTime,
                },
            };
            const sellAgg = await this.prisma.sell.aggregate({
                where: { ...commonWhere, ...timeWhere },
                _sum: { actual: true },
            });
            const sellIds = await this.prisma.sell.findMany({
                where: { ...commonWhere, ...timeWhere },
                select: { id: true },
            });
            group[v]['sell'] = {
                actual: sellAgg._sum.actual || 0,
                id: sellIds.map((item) => item.id).join(','),
                count: sellIds.length,
                idsArr: sellIds.map((item) => item.id),
            };
            const imyAgg = await this.prisma.imy.aggregate({
                where: { ...commonWhere, ...timeWhere },
                _sum: { total: true },
            });
            group[v]['imy'] = { total: imyAgg._sum.total || 0 };
            const iceAgg = await this.prisma.ice.aggregate({
                where: { ...commonWhere, ...timeWhere },
                _sum: { actual: true },
            });
            group[v]['ice'] = { actual: iceAgg._sum.actual || 0 };
        }
        const lattice = {};
        lattice['sve'] = {
            today: Number(group['today']['sell']['actual']),
            yesterday: Number(group['yesterday']['sell']['actual']),
        };
        lattice['nos'] = {
            today: group['today']['sell']['idsArr'],
            yesterday: group['yesterday']['sell']['idsArr'],
        };
        const getSpt = async (ids) => {
            if (ids.length === 0)
                return 0;
            const agg = await this.prisma.summary.aggregate({
                where: {
                    type: 'sell',
                    class: { in: ids },
                },
                _sum: { bct: true },
            });
            return Number(agg._sum.bct || 0);
        };
        lattice['spt'] = {
            today: await getSpt(lattice['nos']['today']),
            yesterday: await getSpt(lattice['nos']['yesterday']),
        };
        lattice['spt']['today'] = Number((lattice['sve']['today'] - lattice['spt']['today']).toFixed(2));
        lattice['spt']['yesterday'] = Number((lattice['sve']['yesterday'] - lattice['spt']['yesterday']).toFixed(2));
        lattice['nos']['today'] = lattice['nos']['today'].length;
        lattice['nos']['yesterday'] = lattice['nos']['yesterday'].length;
        lattice['fund'] = {
            today: Number((lattice['sve']['today'] + Number(group['today']['imy']['total']) + Number(group['today']['ice']['actual'])).toFixed(2)),
            yesterday: Number((lattice['sve']['yesterday'] + Number(group['yesterday']['imy']['total']) + Number(group['yesterday']['ice']['actual'])).toFixed(2)),
        };
        const calcPercent = (today, yesterday) => {
            if (yesterday === 0)
                return today === 0 ? '0' : '100';
            return ((today / yesterday) * 100).toFixed(2);
        };
        lattice['sve']['yesterday'] = calcPercent(lattice['sve']['today'], lattice['sve']['yesterday']);
        lattice['spt']['yesterday'] = calcPercent(lattice['spt']['today'], lattice['spt']['yesterday']);
        lattice['nos']['yesterday'] = calcPercent(lattice['nos']['today'], lattice['nos']['yesterday']);
        lattice['fund']['yesterday'] = calcPercent(lattice['fund']['today'], lattice['fund']['yesterday']);
        const list = {
            room: await this.prisma.room.findMany({ select: { id: true, nums: true } }),
            customer: await this.prisma.customer.findMany({ where: frameFilter, select: { id: true, balance: true } }),
            supplier: await this.prisma.supplier.findMany({ where: frameFilter, select: { id: true, balance: true } }),
        };
        const summary = {};
        summary['goods'] = await this.prisma.goods.count();
        summary['customer'] = list.customer.length;
        summary['supplier'] = list.supplier.length;
        summary['room'] = list.room.reduce((sum, item) => sum + Number(item.nums), 0);
        const rwgCount = await this.prisma.$queryRaw `
      SELECT COUNT(*) as count FROM is_room r
      JOIN is_goods g ON r.goods = g.id
      WHERE r.nums <= g.stock
    `;
        summary['rwg'] = Number(rwgCount[0].count);
        const nowTime = (0, dayjs_1.default)().unix();
        const bwgCount = await this.prisma.$queryRaw `
      SELECT COUNT(*) as count FROM is_batch b
      JOIN is_goods g ON b.goods = g.id
      WHERE b.time + (g.threshold * 86400) < ${nowTime}
    `;
        summary['bwg'] = Number(bwgCount[0].count);
        const accountAgg = await this.prisma.account.aggregate({
            where: frameFilter,
            _sum: { initial: true, balance: true },
        });
        const assets = {};
        assets['account'] = Number(accountAgg._sum.initial || 0) + Number(accountAgg._sum.balance || 0);
        const sy = await this.prisma.summary.groupBy({
            by: ['direction'],
            _sum: { bct: true },
            orderBy: { direction: 'asc' },
        });
        let syIn = 0, syOut = 0;
        sy.forEach(item => {
            if (item.direction === true)
                syIn = Number(item._sum.bct || 0);
            else
                syOut = Number(item._sum.bct || 0);
        });
        assets['rsy'] = syIn - syOut;
        assets['cas'] = list.customer.reduce((sum, item) => sum + Number(item.balance), 0);
        assets['sas'] = list.supplier.reduce((sum, item) => sum + Number(item.balance), 0);
        assets['all'] = assets['account'] + assets['rsy'] + assets['cas'] - assets['sas'];
        for (const k in summary)
            summary[k] = Number(summary[k]);
        for (const k in assets)
            assets[k] = Number(assets[k]);
        const sysFun = await this.prisma.sys.findFirst({ where: { name: 'fun' } });
        let funConfig = { days: 30 };
        try {
            if (sysFun)
                funConfig = JSON.parse(sysFun.info);
        }
        catch (e) { }
        const days = Number(funConfig.days) || 30;
        const option = [];
        const getOldDay = (n) => {
            const dates = [];
            for (let i = n - 1; i >= 0; i--) {
                dates.push((0, dayjs_1.default)().subtract(i, 'day').format('YYYY-MM-DD'));
            }
            return dates;
        };
        const xData = getOldDay(days);
        const deployBase = {
            title: { text: '', left: 'center' },
            xAxis: { type: 'category', boundaryGap: false, data: [] },
            grid: { top: '12%', left: '1%', right: '1%', bottom: '0%', containLabel: true },
            yAxis: { type: 'value' },
            series: [{ data: [], type: 'line', areaStyle: {} }],
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } }
        };
        const tables = {
            buy: '采购单', bre: '采购退货单', sell: '销售单', sre: '销售退货单', imy: '收款单', omy: '付款单'
        };
        const chartStartTime = (0, dayjs_1.default)().subtract(days - 1, 'day').startOf('day').unix();
        const chartEndTime = (0, dayjs_1.default)().endOf('day').unix();
        for (const [table, tableName] of Object.entries(tables)) {
            const isMoneyTable = ['imy', 'omy'].includes(table);
            const sumField = isMoneyTable ? 'total' : 'actual';
            const rawData = await this.prisma.$queryRawUnsafe(`
        SELECT FROM_UNIXTIME(time, '%Y-%m-%d') as date, SUM(${sumField}) as actual
        FROM is_${table}
        WHERE time >= ${chartStartTime} AND time <= ${chartEndTime} AND examine = 1
        GROUP BY FROM_UNIXTIME(time, '%Y-%m-%d')
      `);
            const dataMap = {};
            rawData.forEach(item => {
                dataMap[item.date] = Number(item.actual);
            });
            const yData = xData.map(date => dataMap[date] || 0);
            const chartOption = JSON.parse(JSON.stringify(deployBase));
            chartOption.title.text = tableName;
            chartOption.xAxis.data = xData;
            chartOption.series[0].data = yData;
            option.push(chartOption);
        }
        const deployPie = {
            title: { text: '库存数据', left: 'center' },
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', left: 'left' },
            series: [{ type: 'pie', radius: '60%', data: [] }]
        };
        const pieData = await this.prisma.room.groupBy({
            by: ['warehouse'],
            _sum: { nums: true },
        });
        const warehouseIds = pieData.map(item => item.warehouse);
        const warehouses = await this.prisma.warehouse.findMany({
            where: { id: { in: warehouseIds } }
        });
        const warehouseMap = {};
        warehouses.forEach(w => warehouseMap[w.id] = w.name);
        const pieSeriesData = pieData.map(item => ({
            value: Number(item._sum.nums),
            name: warehouseMap[item.warehouse] || 'Unknown'
        }));
        const pieOption = JSON.parse(JSON.stringify(deployPie));
        pieOption.series[0].data = pieSeriesData;
        option.push(pieOption);
        const fundOption = {
            xAxis: { type: 'category', data: [] },
            grid: { top: '6%', left: '1%', right: '1%', bottom: '0%', containLabel: true },
            yAxis: { type: 'value' },
            series: [{ data: [], type: 'bar', itemStyle: {} }],
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } }
        };
        const fundData = await this.prisma.account.findMany({
            where: frameFilter,
            select: { name: true, initial: true, balance: true }
        });
        fundData.forEach(item => {
            fundOption.xAxis.data.push(item.name);
            fundOption.series[0].data.push(Number(item.initial) + Number(item.balance));
        });
        if (fundOption.xAxis.data.length === 0) {
            fundOption.xAxis.data.push('无数据');
            fundOption.series[0].data.push(0);
        }
        const load = {
            cache: { size: '0MB', rate: 0 },
            mysql: { size: '0MB', rate: 0 }
        };
        const versionRes = await this.prisma.$queryRaw `SELECT VERSION() as ver`;
        const mysqlVer = versionRes[0]['ver'];
        const run = {
            os: process.platform,
            soft: 'Node.js ' + process.version,
            php: 'NestJS',
            mysql: mysqlVer,
            protocol: 'HTTP/1.1'
        };
        return {
            state: 'success',
            info: {
                lattice,
                summary,
                option,
                assets,
                fund: fundOption,
                load,
                run
            }
        };
    }
};
exports.MainService = MainService;
exports.MainService = MainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MainService);
//# sourceMappingURL=main.service.js.map