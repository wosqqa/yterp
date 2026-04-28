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
exports.BorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BorService = class BorService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page = 1, limit = 10, number, supplier, people, startTime, endTime, startArrival, endArrival, state, examine, data, goods } = body;
        const where = {};
        if (user.userId !== 1) {
            where.frame = user.frame;
        }
        if (number)
            where.number = { contains: number };
        if (supplier)
            where.supplier = Number(supplier);
        if (people)
            where.people = Number(people);
        if (state !== undefined && state !== '')
            where.state = Number(state);
        if (examine !== undefined && examine !== '')
            where.examine = Number(examine);
        if (data)
            where.data = { contains: data };
        if (startTime || endTime) {
            where.time = {};
            if (startTime) {
                const start = Number(startTime);
                if (!isNaN(start))
                    where.time.gte = start;
            }
            if (endTime) {
                const end = Number(endTime);
                if (!isNaN(end))
                    where.time.lte = end;
            }
            if (Object.keys(where.time).length === 0) {
                delete where.time;
            }
        }
        if (startArrival || endArrival) {
            where.arrival = {};
            if (startArrival) {
                const start = typeof startArrival === 'string' && startArrival.includes('-')
                    ? Math.floor(new Date(startArrival).getTime() / 1000)
                    : Number(startArrival);
                where.arrival.gte = start;
            }
            if (endArrival) {
                const end = typeof endArrival === 'string' && endArrival.includes('-')
                    ? Math.floor(new Date(endArrival).getTime() / 1000)
                    : Number(endArrival);
                where.arrival.lte = end;
            }
        }
        if (goods) {
            const goodsList = await this.prisma.goods.findMany({
                where: {
                    OR: [
                        { name: { contains: goods } },
                        { py: { contains: goods } }
                    ]
                },
                select: { id: true }
            });
            const goodsIds = goodsList.map(g => g.id);
            const borInfos = await this.prisma.borInfo.findMany({
                where: { goods: { in: goodsIds } },
                select: { pid: true }
            });
            const borIds = borInfos.map(info => info.pid);
            where.id = { in: borIds };
        }
        const count = await this.prisma.bor.count({ where });
        const list = await this.prisma.bor.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const supplierIds = [...new Set(list.map(item => item.supplier))].filter((id) => id !== null);
        const peopleIds = [...new Set(list.map(item => item.people))].filter((id) => id !== null);
        const userIds = [...new Set(list.map(item => item.user))].filter((id) => id !== null);
        const frameIds = [...new Set(list.map(item => item.frame))].filter((id) => id !== null);
        const suppliers = await this.prisma.supplier.findMany({ where: { id: { in: supplierIds } } });
        const peoples = await this.prisma.people.findMany({ where: { id: { in: peopleIds } } });
        const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
        const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });
        const sorIds = [...new Set(list.map(item => item.source).filter((id) => id !== null && id > 0))];
        const buySources = list.map(item => item.id);
        const sors = sorIds.length > 0 ? await this.prisma.sor.findMany({ where: { id: { in: sorIds } } }) : [];
        const buys = await this.prisma.buy.findMany({ where: { source: { in: buySources } } });
        const info = list.map(item => {
            const supplierData = suppliers.find(s => s.id === item.supplier) || null;
            const peopleData = peoples.find(p => p.id === item.people) || null;
            const userData = users.find(u => u.id === item.user) || null;
            const frameData = frames.find(f => f.id === item.frame) || null;
            const relation = [];
            if (item.source) {
                const sor = sors.find(s => s.id === item.source);
                if (sor) {
                    relation.push({
                        type: '销售订单',
                        time: new Date(sor.time * 1000).toISOString().split('T')[0],
                        number: sor.number,
                        sort: sor.time,
                        types: 'sor',
                        id: sor.id
                    });
                }
            }
            const relatedBuys = buys.filter(b => b.source === item.id);
            relatedBuys.forEach(b => {
                relation.push({
                    type: '采购单',
                    time: new Date(b.time * 1000).toISOString().split('T')[0],
                    number: b.number,
                    sort: b.time,
                    types: 'buy',
                    id: b.id
                });
            });
            relation.sort((a, b) => b.sort - a.sort);
            return {
                ...item,
                supplierData,
                peopleData,
                userData,
                frameData,
                relation,
                extension: {}
            };
        });
        return { state: 'success', count, info };
    }
    async save(body, user) {
        const dataSource = body.class ? body.class : body;
        const listSource = body.info ? body.info : body.list;
        const { id, supplier, people, time, arrival, data, logistics, file, more, examine, state } = dataSource;
        if (!supplier)
            return { state: 'error', info: '请选择供应商!' };
        if (!listSource || listSource.length === 0)
            return { state: 'error', info: '请选择商品!' };
        let timeVal = Math.floor(Date.now() / 1000);
        if (time) {
            if (typeof time === 'string' && time.includes('-')) {
                timeVal = Math.floor(new Date(time).getTime() / 1000);
            }
            else {
                timeVal = Number(time);
            }
        }
        const borData = {
            frame: user.frame,
            supplier: Number(supplier),
            people: people ? Number(people) : 0,
            time: timeVal,
            arrival: arrival ? (typeof arrival === 'string' && arrival.includes('-') ? Math.floor(new Date(arrival).getTime() / 1000) : Number(arrival)) : 0,
            logistics: logistics ? (typeof logistics === 'object' ? JSON.stringify(logistics) : String(logistics)) : '',
            file: file ? (typeof file === 'object' ? JSON.stringify(file) : String(file)) : '',
            data: data || '',
            more: more ? (typeof more === 'object' ? JSON.stringify(more) : String(more)) : '',
            examine: !!examine,
            state: state !== undefined ? Number(state) : 0,
            user: user.userId,
            total: 0,
            actual: 0,
            number: dataSource.number || '',
        };
        if ((!id || id === 0) && !borData.number) {
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            borData.number = 'BOR' + dateStr + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        }
        if (!id || id === 0) {
            borData.examine = false;
            borData.state = 0;
        }
        let totalAmount = 0;
        const borInfos = listSource.map((item) => {
            const amount = Number(item.nums) * Number(item.price);
            totalAmount += amount;
            return {
                goods: Number(item.goods),
                nums: Number(item.nums),
                price: Number(item.price),
                total: amount,
                unit: item.unit || '',
                attr: item.attr || '',
                warehouse: item.warehouse ? Number(item.warehouse) : 0,
                discount: item.discount ? Number(item.discount) : 0,
                dsc: item.dsc ? Number(item.dsc) : 0,
                tax: item.tax ? Number(item.tax) : 0,
                tat: item.tat ? Number(item.tat) : 0,
                tpt: item.tpt ? Number(item.tpt) : amount,
                data: item.data || ''
            };
        });
        borData.total = totalAmount;
        borData.actual = totalAmount;
        console.log('Bor Save Data:', borData);
        if (id && id !== 0) {
            await this.prisma.$transaction(async (prisma) => {
                await prisma.bor.update({
                    where: { id: Number(id) },
                    data: borData
                });
                await prisma.borInfo.deleteMany({ where: { pid: Number(id) } });
                for (const info of borInfos) {
                    await prisma.borInfo.create({
                        data: { ...info, pid: Number(id) }
                    });
                }
            });
        }
        else {
            await this.prisma.$transaction(async (prisma) => {
                const newBor = await prisma.bor.create({
                    data: borData
                });
                for (const info of borInfos) {
                    await prisma.borInfo.create({
                        data: { ...info, pid: newBor.id }
                    });
                }
            });
        }
        return { state: 'success' };
    }
};
exports.BorService = BorService;
exports.BorService = BorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BorService);
//# sourceMappingURL=bor.service.js.map