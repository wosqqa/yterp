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
exports.EntryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EntryService = class EntryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(body, user) {
        const dataSource = body.class ? body.class : body;
        const listSource = body.info ? body.info : body.list;
        const costSource = body.cost ? body.cost : [];
        const { id, supplier, people, time, number, data, logistics, file, more, examine, state } = dataSource;
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
        const entryData = {
            frame: user.frame || 1,
            supplier: supplier ? Number(supplier) : 0,
            time: timeVal,
            people: people ? Number(people) : 0,
            logistics: logistics ? (typeof logistics === 'object' ? JSON.stringify(logistics) : String(logistics)) : '',
            file: file ? (typeof file === 'object' ? JSON.stringify(file) : String(file)) : '',
            data: data || '',
            more: more ? (typeof more === 'object' ? JSON.stringify(more) : String(more)) : '',
            examine: !!examine,
            cse: (costSource && costSource.length > 0) ? 0 : 3,
            check: false,
            user: user.userId || 1,
            type: false,
            number: dataSource.number || '',
            total: 0,
        };
        let totalAmount = 0;
        listSource.forEach((item) => {
            totalAmount += Number(item.total || 0);
        });
        entryData.total = totalAmount;
        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                let entryId = id ? Number(id) : 0;
                let newEntry;
                if (entryId === 0) {
                    if (!entryData.number) {
                        entryData.number = 'RK' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + Math.floor(Math.random() * 10000);
                    }
                    newEntry = await prisma.entry.create({
                        data: entryData,
                    });
                    entryId = newEntry.id;
                    await prisma.log.create({
                        data: {
                            time: Math.floor(Date.now() / 1000),
                            user: user.userId || 1,
                            info: `新增其它入库单[ ${entryData.number} ]`
                        }
                    });
                }
                else {
                    newEntry = await prisma.entry.update({
                        where: { id: entryId },
                        data: entryData,
                    });
                    await prisma.log.create({
                        data: {
                            time: Math.floor(Date.now() / 1000),
                            user: user.userId || 1,
                            info: `更新其它入库单[ ${entryData.number} ]`
                        }
                    });
                }
                await prisma.entryInfo.deleteMany({
                    where: { pid: entryId },
                });
                const infoData = listSource.map((item) => ({
                    pid: entryId,
                    goods: Number(item.goods),
                    attr: item.attr || '',
                    unit: item.unit || '',
                    warehouse: item.warehouse ? Number(item.warehouse) : 0,
                    batch: item.batch || '',
                    mfd: item.mfd ? (typeof item.mfd === 'string' && item.mfd.includes('-') ? Math.floor(new Date(item.mfd).getTime() / 1000) : Number(item.mfd)) : 0,
                    price: Number(item.price),
                    nums: Number(item.nums),
                    serial: item.serial ? (typeof item.serial === 'object' ? JSON.stringify(item.serial) : String(item.serial)) : '',
                    total: Number(item.total),
                    data: item.data || '',
                }));
                if (infoData.length > 0) {
                    await prisma.entryInfo.createMany({
                        data: infoData,
                    });
                }
                await prisma.cost.deleteMany({
                    where: { type: 'entry', class: entryId },
                });
                if (costSource && costSource.length > 0) {
                    const costData = costSource.map((item) => ({
                        type: 'entry',
                        class: entryId,
                        iet: Number(item.iet),
                        time: timeVal,
                        money: Number(item.money),
                        settle: 0,
                        state: 0,
                        data: item.data || '',
                    }));
                    await prisma.cost.createMany({
                        data: costData,
                    });
                }
                return entryId;
            });
            return { state: 'success', info: result };
        }
        catch (error) {
            console.error(error);
            return { state: 'error', info: '内部错误,操作已撤销!', error: error.message };
        }
    }
    async record(body) {
        const { page, limit, supplier, number, people, startTime, endTime, type, examine, cse, check, user, data, goods, } = body || {};
        if (page === undefined || limit === undefined) {
            return { state: 'error', info: '传入参数不完整!' };
        }
        const where = {};
        if (supplier !== undefined && supplier !== '')
            where.supplier = Number(supplier);
        if (number !== undefined && number !== '')
            where.number = { contains: String(number) };
        if (people !== undefined && people !== '')
            where.people = Number(people);
        if (type !== undefined && type !== '')
            where.type = Boolean(Number(type));
        if (examine !== undefined && examine !== '')
            where.examine = Boolean(Number(examine));
        if (cse !== undefined && cse !== '')
            where.cse = Number(cse);
        if (check !== undefined && check !== '')
            where.check = Boolean(Number(check));
        if (user !== undefined && user !== '')
            where.user = Number(user);
        if (data !== undefined && data !== '')
            where.data = { contains: String(data) };
        if (startTime !== undefined || endTime !== undefined) {
            where.time = {};
            if (startTime !== undefined && startTime !== '') {
                where.time.gte =
                    typeof startTime === 'string' && startTime.includes('-')
                        ? Math.floor(new Date(startTime).getTime() / 1000)
                        : Number(startTime);
            }
            if (endTime !== undefined && endTime !== '') {
                where.time.lte =
                    typeof endTime === 'string' && endTime.includes('-')
                        ? Math.floor(new Date(endTime).getTime() / 1000)
                        : Number(endTime);
            }
        }
        if (goods !== undefined && goods !== '') {
            const goodsRows = await this.prisma.goods.findMany({
                where: { OR: [{ name: { contains: String(goods) } }, { py: { contains: String(goods) } }] },
                select: { id: true },
            });
            const goodsIds = goodsRows.map((g) => g.id);
            if (goodsIds.length === 0) {
                return { state: 'success', count: 0, info: [] };
            }
            const infoRows = await this.prisma.entryInfo.findMany({
                where: { goods: { in: goodsIds } },
                select: { pid: true },
            });
            const pids = [...new Set(infoRows.map((r) => r.pid))];
            if (pids.length === 0) {
                return { state: 'success', count: 0, info: [] };
            }
            where.id = { in: pids };
        }
        const total = await this.prisma.entry.count({ where });
        const list = await this.prisma.entry.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const ids = list.map((v) => v.id);
        const frameIds = [...new Set(list.map((v) => v.frame))];
        const peopleIds = [...new Set(list.map((v) => Number(v.people || 0)).filter((v) => v > 0))];
        const userIds = [...new Set(list.map((v) => v.user))];
        const supplierIds = [...new Set(list.map((v) => Number(v.supplier || 0)).filter((v) => v > 0))];
        const [frames, peoples, users, suppliers, costs, records, iets] = await Promise.all([
            frameIds.length ? this.prisma.frame.findMany({ where: { id: { in: frameIds } } }) : Promise.resolve([]),
            peopleIds.length ? this.prisma.people.findMany({ where: { id: { in: peopleIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
            userIds.length ? this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
            supplierIds.length ? this.prisma.supplier.findMany({ where: { id: { in: supplierIds } } }) : Promise.resolve([]),
            ids.length
                ? this.prisma.cost.findMany({
                    where: { type: 'entry', class: { in: ids } },
                    orderBy: { id: 'desc' },
                    select: {
                        id: true,
                        type: true,
                        class: true,
                        iet: true,
                        time: true,
                        money: true,
                        settle: true,
                        state: true,
                        data: true,
                    },
                })
                : Promise.resolve([]),
            ids.length ? this.prisma.record.findMany({ where: { type: 'entry', source: { in: ids } }, orderBy: { id: 'desc' } }) : Promise.resolve([]),
            this.prisma.iet.findMany({ select: { id: true, name: true } }),
        ]);
        const frameMap = new Map(frames.map((v) => [v.id, v]));
        const peopleMap = new Map(peoples.map((v) => [v.id, v]));
        const userMap = new Map(users.map((v) => [v.id, v]));
        const supplierMap = new Map(suppliers.map((v) => [v.id, v]));
        const ietMap = new Map(iets.map((v) => [v.id, v]));
        const costMap = new Map();
        for (const c of costs) {
            const row = {
                ...c,
                money: Number(c.money),
                settle: Number(c.settle),
                more: {},
                ietData: ietMap.get(c.iet) || null,
                extension: {
                    type: {
                        buy: '采购单',
                        bre: '采购退货单',
                        sell: '销售单',
                        sre: '销售退货单',
                        vend: '零售单',
                        vre: '零售退货单',
                        barter: '积分兑换单',
                        swap: '调拨单',
                        entry: '其它入库单',
                        extry: '其它出库单',
                    }[c.type] || '',
                    state: ['未结算', '部分结算', '已结算'][c.state] || '',
                },
            };
            if (!costMap.has(c.class))
                costMap.set(c.class, []);
            costMap.get(c.class).push(row);
        }
        const recordMap = new Map();
        for (const r of records) {
            const row = {
                ...r,
                userData: userMap.get(r.user) || null,
                extension: { time: new Date(r.time * 1000).toISOString().slice(0, 16).replace('T', ' ') },
            };
            if (!recordMap.has(r.source))
                recordMap.set(r.source, []);
            recordMap.get(r.source).push(row);
        }
        const info = list.map((item) => {
            let logisticsObj = null;
            let logisticsStr = '';
            try {
                logisticsObj = item.logistics ? JSON.parse(item.logistics) : null;
            }
            catch {
                logisticsObj = null;
            }
            if (logisticsObj) {
                if (!logisticsObj.key)
                    logisticsStr = '';
                else if (logisticsObj.key === 'auto')
                    logisticsStr = logisticsObj.number;
                else
                    logisticsStr = `${logisticsObj.name}|${logisticsObj.number}`;
            }
            let fileObj = [];
            try {
                fileObj = item.file ? JSON.parse(item.file) : [];
            }
            catch {
                fileObj = [];
            }
            let moreObj = {};
            try {
                moreObj = item.more ? JSON.parse(item.more) : {};
            }
            catch {
                moreObj = {};
            }
            const supplierData = supplierMap.get(Number(item.supplier || 0)) || null;
            let supplierDataFmt = null;
            if (supplierData) {
                let contacts = [];
                try {
                    contacts = supplierData.contacts ? JSON.parse(supplierData.contacts) : [];
                }
                catch {
                    contacts = [];
                }
                let supplierMore = {};
                try {
                    supplierMore = supplierData.more ? JSON.parse(supplierData.more) : {};
                }
                catch {
                    supplierMore = {};
                }
                const main = Array.isArray(contacts) ? contacts.find((c) => c?.main) : null;
                supplierDataFmt = {
                    ...supplierData,
                    rate: Number(supplierData.rate),
                    balance: Number(supplierData.balance),
                    contacts,
                    more: supplierMore,
                    extension: { contact: main ? `${main.name} | ${main.tel} | ${main.add}` : '' },
                };
            }
            return {
                ...item,
                time: new Date(item.time * 1000).toISOString().slice(0, 10),
                total: Number(item.total),
                logistics: logisticsObj,
                file: fileObj,
                more: moreObj,
                frameData: frameMap.get(item.frame) || null,
                peopleData: peopleMap.get(Number(item.people || 0)) || null,
                userData: userMap.get(item.user) || null,
                supplierData: supplierDataFmt,
                costData: costMap.get(item.id) || [],
                recordData: recordMap.get(item.id) || [],
                extension: {
                    type: item.type ? '盘盈单' : '其它入库单',
                    logistics: logisticsStr,
                    cse: ['未结算', '部分结算', '已结算', '无需结算'][item.cse] || '',
                    examine: item.examine ? '已审核' : '未审核',
                    check: item.check ? '已核对' : '未核对',
                },
            };
        });
        return { state: 'success', count: total, info };
    }
    async get(body) {
        const { parm } = body;
        if (!parm)
            return { state: 'error', info: '传入参数不完整!' };
        const entry = await this.prisma.entry.findUnique({ where: { id: Number(parm) } });
        const info = await this.prisma.entryInfo.findMany({ where: { pid: Number(parm) } });
        const cost = await this.prisma.cost.findMany({ where: { type: 'entry', class: Number(parm) } });
        return {
            state: 'success',
            info: {
                class: entry,
                info: info,
                cost: cost
            }
        };
    }
    async del(body, user) {
        const { parm } = body;
        if (!parm || !Array.isArray(parm))
            return { state: 'error', info: '传入参数不完整!' };
        try {
            await this.prisma.$transaction(async (prisma) => {
                const examined = await prisma.entry.findFirst({
                    where: {
                        id: { in: parm.map(Number) },
                        examine: true
                    }
                });
                if (examined) {
                    throw new Error(`单据[${examined.number}]已审核,不可删除!`);
                }
                await prisma.entry.deleteMany({ where: { id: { in: parm.map(Number) } } });
                await prisma.entryInfo.deleteMany({ where: { pid: { in: parm.map(Number) } } });
                await prisma.cost.deleteMany({ where: { type: 'entry', class: { in: parm.map(Number) } } });
                await prisma.log.create({
                    data: {
                        time: Math.floor(Date.now() / 1000),
                        user: user.userId || 1,
                        info: `删除其它入库单 IDs: ${parm.join(',')}`
                    }
                });
            });
            return { state: 'success' };
        }
        catch (error) {
            return { state: 'error', info: error.message || '内部错误' };
        }
    }
    async check(body, user) {
        const { parm } = body;
        if (!parm || !Array.isArray(parm))
            return { state: 'error', info: '传入参数不完整!' };
        try {
            await this.prisma.$transaction(async (prisma) => {
                const entries = await prisma.entry.findMany({
                    where: { id: { in: parm.map(Number) } }
                });
                for (const entry of entries) {
                    const newCheck = !entry.check;
                    await prisma.entry.update({
                        where: { id: entry.id },
                        data: { check: newCheck }
                    });
                    await prisma.log.create({
                        data: {
                            time: Math.floor(Date.now() / 1000),
                            user: user.userId || 1,
                            info: `${newCheck ? '核对' : '反核对'}其它入库单[ ${entry.number} ]`
                        }
                    });
                }
            });
            return { state: 'success' };
        }
        catch (error) {
            return { state: 'error', info: error.message || '内部错误' };
        }
    }
    async examine(body, user) {
        const { parm } = body;
        if (!parm || !Array.isArray(parm))
            return { state: 'error', info: '传入参数不完整!' };
        try {
            await this.prisma.$transaction(async (prisma) => {
                const entries = await prisma.entry.findMany({
                    where: { id: { in: parm.map(Number) } }
                });
                for (const entry of entries) {
                    const infos = await prisma.entryInfo.findMany({
                        where: { pid: entry.id }
                    });
                    const goodsIds = [...new Set(infos.map(i => i.goods))];
                    const goodsList = await prisma.goods.findMany({
                        where: { id: { in: goodsIds } }
                    });
                    const goodsMap = new Map(goodsList.map(g => [g.id, g]));
                    if (!entry.examine) {
                        for (const info of infos) {
                            const goods = goodsMap.get(info.goods);
                            if (!goods)
                                continue;
                            if (!goods.type) {
                                const room = await prisma.room.findFirst({
                                    where: {
                                        warehouse: info.warehouse || 0,
                                        goods: info.goods,
                                        attr: info.attr || ''
                                    }
                                });
                                let roomId;
                                if (room) {
                                    await prisma.room.update({
                                        where: { id: room.id },
                                        data: { nums: { increment: info.nums } }
                                    });
                                    roomId = room.id;
                                }
                                else {
                                    const newRoom = await prisma.room.create({
                                        data: {
                                            warehouse: info.warehouse || 0,
                                            goods: info.goods,
                                            attr: info.attr || '',
                                            nums: info.nums
                                        }
                                    });
                                    roomId = newRoom.id;
                                }
                                await prisma.roomInfo.create({
                                    data: {
                                        pid: roomId,
                                        type: 'entry',
                                        class: entry.id,
                                        info: info.id,
                                        time: entry.time,
                                        direction: 1,
                                        price: info.price,
                                        nums: info.nums
                                    }
                                });
                                if (info.batch) {
                                    const batch = await prisma.batch.findFirst({
                                        where: {
                                            room: roomId,
                                            number: info.batch
                                        }
                                    });
                                    if (batch) {
                                        await prisma.batch.update({
                                            where: { id: batch.id },
                                            data: { nums: { increment: info.nums } }
                                        });
                                    }
                                    else {
                                        await prisma.batch.create({
                                            data: {
                                                room: roomId,
                                                warehouse: info.warehouse || 0,
                                                goods: info.goods,
                                                number: info.batch,
                                                time: info.mfd || 0,
                                                nums: info.nums
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        await prisma.entry.update({
                            where: { id: entry.id },
                            data: { examine: true }
                        });
                        await prisma.log.create({
                            data: {
                                time: Math.floor(Date.now() / 1000),
                                user: user.userId || 1,
                                info: `审核其它入库单[ ${entry.number} ]`
                            }
                        });
                    }
                    else {
                        for (const info of infos) {
                            const goods = goodsMap.get(info.goods);
                            if (!goods || goods.type)
                                continue;
                            const room = await prisma.room.findFirst({
                                where: {
                                    warehouse: info.warehouse || 0,
                                    goods: info.goods,
                                    attr: info.attr || ''
                                }
                            });
                            if (room) {
                                await prisma.room.update({
                                    where: { id: room.id },
                                    data: { nums: { decrement: info.nums } }
                                });
                            }
                            await prisma.roomInfo.deleteMany({
                                where: {
                                    type: 'entry',
                                    class: entry.id,
                                    info: info.id
                                }
                            });
                            if (info.batch && room) {
                                await prisma.batch.updateMany({
                                    where: {
                                        room: room.id,
                                        number: info.batch
                                    },
                                    data: { nums: { decrement: info.nums } }
                                });
                            }
                        }
                        await prisma.entry.update({
                            where: { id: entry.id },
                            data: { examine: false }
                        });
                        await prisma.log.create({
                            data: {
                                time: Math.floor(Date.now() / 1000),
                                user: user.userId || 1,
                                info: `反审核其它入库单[ ${entry.number} ]`
                            }
                        });
                    }
                }
            });
            return { state: 'success' };
        }
        catch (error) {
            console.error(error);
            return { state: 'error', info: error.message || '内部错误' };
        }
    }
};
exports.EntryService = EntryService;
exports.EntryService = EntryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EntryService);
//# sourceMappingURL=entry.service.js.map