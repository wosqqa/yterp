import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class MainService {
  constructor(private prisma: PrismaService) {}

  async record(user: any) {
    // 格子汇总
    const dayTime = dayjs().startOf('day').unix();
    const group = {
      today: {},
      yesterday: {},
    };

    // sqlAuth 模拟: 简单起见，假设管理员(role=0)看所有，否则看自己的(或者根据frame)
    // 这里先简化为不做严格的权限过滤，或者根据 user.frame 过滤
    const frameFilter = user.role === 0 ? {} : { frame: user.frame };
    // const userFilter = user.role === 0 ? {} : { user: user.id }; 
    // PHP sqlAuth 逻辑比较复杂，这里先应用 frame 过滤
    const commonWhere = {
      ...frameFilter,
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

      // Sell
      const sellAgg = await this.prisma.sell.aggregate({
        where: { ...commonWhere, ...timeWhere, examine: 1 },
        _sum: { actual: true },
      });
      const sellIds = await this.prisma.sell.findMany({
        where: { ...commonWhere, ...timeWhere, examine: 1 },
        select: { id: true },
      });
      group[v]['sell'] = {
        actual: sellAgg._sum?.actual || 0,
        id: sellIds.map((item) => item.id).join(','),
        count: sellIds.length,
        idsArr: sellIds.map((item) => item.id),
      };

      // Imy
      const imyAgg = await this.prisma.imy.aggregate({
        where: { ...commonWhere, ...timeWhere, examine: true },
        _sum: { total: true },
      });
      group[v]['imy'] = { total: imyAgg._sum?.total || 0 };

      // Ice
      const iceAgg = await this.prisma.ice.aggregate({
        where: { ...commonWhere, ...timeWhere, examine: true },
        _sum: { actual: true },
      });
      group[v]['ice'] = { actual: iceAgg._sum?.actual || 0 };
    }

    const lattice: any = {};
    lattice['sve'] = {
      today: Number(group['today']['sell']['actual']),
      yesterday: Number(group['yesterday']['sell']['actual']),
    };

    lattice['nos'] = {
      today: group['today']['sell']['idsArr'],
      yesterday: group['yesterday']['sell']['idsArr'],
    };

    // Spt logic
    // Db::name('summary')->whereOr([[['type','=','sell'],['class','in',$lattice['nos']['today']['sell']]]])->fieldRaw('sum(bct) as bct')
    const getSpt = async (ids: number[]) => {
      if (ids.length === 0) return 0;
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

    // Calculate profit: sve - spt
    lattice['spt']['today'] = Number((lattice['sve']['today'] - lattice['spt']['today']).toFixed(2));
    lattice['spt']['yesterday'] = Number((lattice['sve']['yesterday'] - lattice['spt']['yesterday']).toFixed(2));

    // Nos count
    lattice['nos']['today'] = lattice['nos']['today'].length;
    lattice['nos']['yesterday'] = lattice['nos']['yesterday'].length;

    // Fund
    lattice['fund'] = {
      today: Number((lattice['sve']['today'] + Number(group['today']['imy']['total']) + Number(group['today']['ice']['actual'])).toFixed(2)),
      yesterday: Number((lattice['sve']['yesterday'] + Number(group['yesterday']['imy']['total']) + Number(group['yesterday']['ice']['actual'])).toFixed(2)),
    };

    // Percentage calculation
    const calcPercent = (today: number, yesterday: number) => {
      if (yesterday === 0) return today === 0 ? '0' : '100';
      return ((today / yesterday) * 100).toFixed(2);
    };

    lattice['sve']['yesterday'] = calcPercent(lattice['sve']['today'], lattice['sve']['yesterday']);
    lattice['spt']['yesterday'] = calcPercent(lattice['spt']['today'], lattice['spt']['yesterday']);
    lattice['nos']['yesterday'] = calcPercent(lattice['nos']['today'], lattice['nos']['yesterday']);
    lattice['fund']['yesterday'] = calcPercent(lattice['fund']['today'], lattice['fund']['yesterday']);


    // 汇总信息
    const list = {
      room: await this.prisma.room.findMany({ select: { id: true, nums: true } }), // 简化权限
      customer: await this.prisma.customer.findMany({ where: frameFilter, select: { id: true, balance: true } }),
      supplier: await this.prisma.supplier.findMany({ where: frameFilter, select: { id: true, balance: true } }),
    };

    const summary: any = {};
    summary['goods'] = await this.prisma.goods.count();
    summary['customer'] = list.customer.length;
    summary['supplier'] = list.supplier.length;
    summary['room'] = list.room.reduce((sum, item) => sum + Number(item.nums), 0);

    // RWG: room.nums <= stock
    // Prisma doesn't support field comparison in where easily, using raw query or fetch all
    // Or querying goods with stock, then checking room
    // Using raw query for efficiency
    // Db::name('room')->alias('room')->where([['id','in',array_column($list['room'],'id')]])->whereExists(...)
    // Simplified: find rooms where nums <= linked goods.stock
    const rwgCount: any = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM is_room r
      JOIN is_goods g ON r.goods = g.id
      WHERE r.nums <= g.stock
    `;
    summary['rwg'] = Number(rwgCount[0].count);

    // BWG: batch.time + threshold < now
    // batch.time + (threshold * 86400) < now
    const nowTime = dayjs().unix();
    const bwgCount: any = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM is_batch b
      JOIN is_goods g ON b.goods = g.id
      WHERE b.time + (g.threshold * 86400) < ${nowTime}
    `;
    summary['bwg'] = Number(bwgCount[0].count);


    // 资产数据
    const accountAgg = await this.prisma.account.aggregate({
      where: frameFilter,
      _sum: { initial: true, balance: true },
    });
    const assets: any = {};
    assets['account'] = Number(accountAgg._sum.initial || 0) + Number(accountAgg._sum.balance || 0);

    const sy = await this.prisma.summary.groupBy({
      by: ['direction'],
      _sum: { bct: true },
      orderBy: { direction: 'asc' },
    });
    // sy structure: [{direction: false/0, _sum: {bct: ...}}, {direction: true/1, ...}]
    // PHP: $sy[0] is out (0), $sy[1] is in (1)
    // 0: out, 1: in. Profit = in - out
    let syIn = 0, syOut = 0;
    sy.forEach(item => {
      if (item.direction === true) syIn = Number(item._sum.bct || 0); // 1: in
      else syOut = Number(item._sum.bct || 0); // 0: out
    });
    assets['rsy'] = syIn - syOut;

    assets['cas'] = list.customer.reduce((sum, item) => sum + Number(item.balance), 0);
    assets['sas'] = list.supplier.reduce((sum, item) => sum + Number(item.balance), 0);
    assets['all'] = assets['account'] + assets['rsy'] + assets['cas'] - assets['sas'];

    // Float conversion
    for (const k in summary) summary[k] = Number(summary[k]);
    for (const k in assets) assets[k] = Number(assets[k]);


    // 图表数据
    // Get Sys fun
    const sysFun = await this.prisma.sys.findFirst({ where: { name: 'fun' } });
    let funConfig: any = { days: 30 };
    try {
      if (sysFun) funConfig = JSON.parse(sysFun.info);
    } catch (e) {}

    const days = Number(funConfig.days) || 30;
    const option: any[] = [];
    
    // Helper to get past N days
    const getOldDay = (n: number) => {
      const dates: string[] = [];
      for (let i = n - 1; i >= 0; i--) {
        dates.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
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

    const chartStartTime = dayjs().subtract(days - 1, 'day').startOf('day').unix();
    const chartEndTime = dayjs().endOf('day').unix();

    for (const [table, tableName] of Object.entries(tables)) {
      // Group by day
      // Prisma groupBy doesn't support formatting timestamp to date easily.
      // We can fetch all data in range and process in memory, or use raw query.
      // Using raw query for grouping by date(from timestamp)
      const isMoneyTable = ['imy', 'omy'].includes(table);
      const sumField = isMoneyTable ? 'total' : 'actual';
      
      const rawData: any[] = await this.prisma.$queryRawUnsafe(`
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

    // Pie chart (Inventory distribution)
    const deployPie = {
      title: { text: '库存数据', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{ type: 'pie', radius: '60%', data: [] }]
    };

    // Group room by warehouse
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


    // Fund Chart
    const fundOption: any = {
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


    // Load & Run
    const load = {
      cache: { size: '0MB', rate: 0 }, // Mock
      mysql: { size: '0MB', rate: 0 }  // Mock
    };
    
    // Get MySQL version
    const versionRes: any = await this.prisma.$queryRaw`SELECT VERSION() as ver`;
    const mysqlVer = versionRes[0]['ver'];

    const run = {
      os: process.platform,
      soft: 'Node.js ' + process.version,
      php: 'NestJS', // Replace PHP version
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
}
