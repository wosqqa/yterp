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
exports.BuyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dayjs_1 = __importDefault(require("dayjs"));
let BuyService = class BuyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page, limit, number, supplier, people, startTime, endTime, examine, nucleus, cse, invoice, check, data, goods } = body;
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
        if (examine !== undefined && examine !== '')
            where.examine = Number(examine);
        if (nucleus !== undefined && nucleus !== '')
            where.nucleus = Number(nucleus);
        if (cse !== undefined && cse !== '')
            where.cse = Number(cse);
        if (invoice !== undefined && invoice !== '')
            where.invoice = Number(invoice);
        if (check !== undefined && check !== '')
            where.check = Number(check);
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
            const buyInfos = await this.prisma.buyInfo.findMany({
                where: { goods: { in: goodsIds } },
                select: { pid: true }
            });
            const buyIds = buyInfos.map(info => info.pid);
            where.id = { in: buyIds };
        }
        const count = await this.prisma.buy.count({ where });
        const list = await this.prisma.buy.findMany({
            where,
            skip: (Number(page || 1) - 1) * Number(limit || 10),
            take: Number(limit || 10),
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
        const borIds = [...new Set(list.map(item => item.source).filter((id) => id !== null && id > 0))];
        const breSources = list.map(item => item.id);
        const bors = borIds.length > 0 ? await this.prisma.bor.findMany({ where: { id: { in: borIds } } }) : [];
        const bres = await this.prisma.bre.findMany({ where: { source: { in: breSources } } });
        const info = list.map(item => {
            const supplierData = suppliers.find(s => s.id === item.supplier) || null;
            const peopleData = peoples.find(p => p.id === item.people) || null;
            const userData = users.find(u => u.id === item.user) || null;
            const frameData = frames.find(f => f.id === item.frame) || null;
            const relation = [];
            if (item.source) {
                const bor = bors.find(s => s.id === item.source);
                if (bor) {
                    relation.push({
                        type: '采购订单',
                        time: new Date(bor.time * 1000).toISOString().split('T')[0],
                        number: bor.number,
                        sort: bor.time,
                        types: 'bor',
                        id: bor.id
                    });
                }
            }
            const relatedBres = bres.filter(b => b.source === item.id);
            relatedBres.forEach(b => {
                relation.push({
                    type: '采购退货单',
                    time: new Date(b.time * 1000).toISOString().split('T')[0],
                    number: b.number,
                    sort: b.time,
                    types: 'bre',
                    id: b.id
                });
            });
            relation.sort((a, b) => b.sort - a.sort);
            const examineState = item.examine ? "已审核" : "未审核";
            const nucleusStates = ["未核销", "部分核销", "已核销"];
            const nucleusState = nucleusStates[Number(item.nucleus)] || "未核销";
            const cseStates = ["未结算", "部分结算", "已结算", "无需结算"];
            const cseState = cseStates[Number(item.cse)] || "未结算";
            const invoiceStates = ["未开具", "部分开具", "已开具", "无需开具"];
            const invoiceState = invoiceStates[Number(item.invoice)] || "未开具";
            const checkState = item.check ? "已核对" : "未核对";
            let logisticsObj = { key: "auto", name: "自动识别", number: "" };
            try {
                if (item.logistics)
                    logisticsObj = JSON.parse(item.logistics);
            }
            catch (e) { }
            let moreObj = {};
            try {
                if (item.more)
                    moreObj = JSON.parse(item.more);
            }
            catch (e) { }
            let fileArr = [];
            try {
                if (item.file)
                    fileArr = JSON.parse(item.file);
            }
            catch (e) { }
            return {
                ...item,
                time: new Date(item.time * 1000).toISOString().split('T')[0],
                total: Number(item.total),
                actual: Number(item.actual),
                money: Number(item.money),
                cost: Number(item.cost),
                logistics: logisticsObj,
                more: moreObj,
                file: fileArr,
                examine: item.examine ? 1 : 0,
                nucleus: item.nucleus ? 2 : 1,
                cse: item.cse ? 2 : 1,
                invoice: item.invoice ? 2 : 1,
                check: item.check ? 1 : 0,
                supplierData,
                peopleData,
                userData,
                frameData,
                relation,
                billData: [],
                costData: [],
                invoiceData: [],
                recordData: [],
                extension: {
                    logistics: logisticsObj.number || "",
                    examine: examineState,
                    nucleus: nucleusState,
                    cse: cseState,
                    invoice: invoiceState,
                    check: checkState,
                    amount: Number(item.actual),
                    anwo: 0
                }
            };
        });
        return { state: 'success', count, info };
    }
    async save(body, user) {
        try {
            const dataSource = body.class ? body.class : body;
            const listSource = body.info ? body.info : body.list;
            const { id, supplier, people, time, data } = dataSource;
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
            const stringify = (val, fallback) => {
                if (val === null || val === undefined)
                    return fallback;
                if (typeof val === 'string')
                    return val;
                try {
                    return JSON.stringify(val);
                }
                catch (e) {
                    return fallback;
                }
            };
            const toMfd = (val) => {
                if (!val)
                    return 0;
                if (typeof val === 'string' && val.includes('-'))
                    return (0, dayjs_1.default)(val).startOf('day').unix();
                const n = Number(val);
                return Number.isFinite(n) ? n : 0;
            };
            const buyData = {
                frame: user.frame,
                supplier: Number(supplier),
                people: people ? Number(people) : 0,
                time: timeVal,
                data: data || '',
                user: user.userId,
                total: 0,
                actual: 0,
                money: 0,
                cost: 0,
                number: dataSource.number || '',
                logistics: stringify(dataSource.logistics, ''),
                file: stringify(dataSource.file, ''),
                more: stringify(dataSource.more, ''),
            };
            if ((!id || id === 0) && !buyData.number) {
                const date = new Date();
                const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                buyData.number = 'CG' + dateStr + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            }
            if (!id || id === 0) {
                buyData.examine = false;
                buyData.nucleus = false;
                buyData.cse = false;
                buyData.invoice = false;
                buyData.check = false;
                buyData.source = dataSource.source ? Number(dataSource.source) : 0;
            }
            let totalAmount = 0;
            const buyInfos = listSource.map((item) => {
                const price = Number(item.price);
                const nums = Number(item.nums);
                const amount = price * nums;
                totalAmount += Number.isFinite(amount) ? amount : 0;
                return {
                    source: item.source ? Number(item.source) : 0,
                    goods: Number(item.goods),
                    nums,
                    price,
                    total: item.total != null && item.total !== '' ? Number(item.total) : amount,
                    unit: item.unit || '',
                    attr: item.attr || '',
                    warehouse: item.warehouse ? Number(item.warehouse) : 0,
                    discount: item.discount != null && item.discount !== '' ? Number(item.discount) : 0,
                    dsc: item.dsc != null && item.dsc !== '' ? Number(item.dsc) : 0,
                    tax: item.tax != null && item.tax !== '' ? Number(item.tax) : 0,
                    tat: item.tat != null && item.tat !== '' ? Number(item.tat) : 0,
                    tpt: item.tpt != null && item.tpt !== '' ? Number(item.tpt) : amount,
                    data: item.data || '',
                    batch: item.batch || '',
                    mfd: toMfd(item.mfd),
                    serial: stringify(item.serial, ''),
                    retreat: 0,
                };
            });
            buyData.total = totalAmount;
            buyData.actual = dataSource.actual ? Number(dataSource.actual) : totalAmount;
            if (id && id !== 0) {
                await this.prisma.$transaction(async (prisma) => {
                    await prisma.buy.update({
                        where: { id: Number(id) },
                        data: buyData,
                    });
                    await prisma.buyInfo.deleteMany({ where: { pid: Number(id) } });
                    for (const info of buyInfos) {
                        await prisma.buyInfo.create({
                            data: { ...info, pid: Number(id) },
                        });
                    }
                });
            }
            else {
                await this.prisma.$transaction(async (prisma) => {
                    const newBuy = await prisma.buy.create({
                        data: buyData,
                    });
                    for (const info of buyInfos) {
                        await prisma.buyInfo.create({
                            data: { ...info, pid: newBuy.id },
                        });
                    }
                });
            }
            return { state: 'success' };
        }
        catch (e) {
            return { state: 'error', info: e?.message || '内部错误' };
        }
    }
    async get(body) {
        try {
            if (body.parm === undefined) {
                return { state: 'error', info: '传入参数不完整!' };
            }
            const parseJsonArray = (val) => {
                if (Array.isArray(val))
                    return val;
                if (typeof val !== 'string')
                    return [];
                const s = val.trim();
                if (!s)
                    return [];
                try {
                    const parsed = JSON.parse(s);
                    return Array.isArray(parsed) ? parsed : [];
                }
                catch (e) {
                    return [];
                }
            };
            const parseJsonObject = (val) => {
                if (val && typeof val === 'object' && !Array.isArray(val))
                    return val;
                if (typeof val !== 'string')
                    return {};
                const s = val.trim();
                if (!s)
                    return {};
                try {
                    const parsed = JSON.parse(s);
                    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
                }
                catch (e) {
                    return {};
                }
            };
            const id = Number(body.parm);
            if (!id) {
                return { state: 'error', info: '传入参数不正确!' };
            }
            const classData = await this.prisma.buy.findUnique({
                where: { id },
            });
            if (!classData) {
                return { state: 'error', info: '数据不存在!' };
            }
            const infoList = await this.prisma.buyInfo.findMany({
                where: { pid: id },
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    pid: true,
                    source: true,
                    goods: true,
                    attr: true,
                    unit: true,
                    warehouse: true,
                    batch: true,
                    price: true,
                    nums: true,
                    serial: true,
                    retreat: true,
                    discount: true,
                    dsc: true,
                    total: true,
                    tax: true,
                    tat: true,
                    tpt: true,
                    data: true,
                },
            });
            const goodsIds = [...new Set(infoList.map((item) => item.goods))];
            const warehouseIds = [
                ...new Set(infoList
                    .map((item) => item.warehouse)
                    .filter((wid) => wid !== null && wid !== 0)),
            ];
            const goodsList = goodsIds.length > 0
                ? await this.prisma.goods.findMany({ where: { id: { in: goodsIds } } })
                : [];
            const warehouseList = warehouseIds.length > 0
                ? await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } })
                : [];
            const goodsNormalized = goodsList.map((g) => {
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
            const info = infoList.map((item) => {
                const goodsData = goodsNormalized.find((g) => g.id === item.goods) || null;
                const warehouseData = warehouseList.find((w) => w.id === item.warehouse) || null;
                let parsedSerial = [];
                try {
                    parsedSerial = parseJsonArray(item.serial);
                }
                catch (e) {
                    parsedSerial = [];
                }
                const imgsList = goodsData ? parseJsonArray(goodsData.imgs) : [];
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
                    mfd: '',
                    serial: parsedSerial,
                    goodsData,
                    warehouseData,
                    imgs: imgsList[0] || '',
                    key: item.goods,
                    warehouseId: item.warehouse,
                };
            });
            let logisticsObj = { key: 'auto', name: '自动识别', number: '' };
            try {
                if (classData.logistics)
                    logisticsObj = JSON.parse(classData.logistics);
            }
            catch (e) { }
            const moreObj = parseJsonObject(classData.more);
            let fileArr = [];
            try {
                if (classData.file)
                    fileArr = JSON.parse(classData.file);
            }
            catch (e) { }
            const timeStr = typeof classData.time === 'number'
                ? dayjs_1.default.unix(classData.time).format('YYYY-MM-DD')
                : (0, dayjs_1.default)(classData.time).format('YYYY-MM-DD');
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
                examine: classData.examine ? 1 : 0,
                nucleus: Number(classData.nucleus ?? 0),
                cse: Number(classData.cse ?? 0),
                invoice: Number(classData.invoice ?? 0),
                check: classData.check ? 1 : 0,
            };
            return { state: 'success', info: { class: formattedClass, info, cost: [] } };
        }
        catch (e) {
            return { state: 'error', info: e?.message || '内部错误,操作已撤销!' };
        }
    }
    async del(body) {
        return { state: 'error', info: 'Not implemented' };
    }
    async check(body) {
        return { state: 'error', info: 'Not implemented' };
    }
    async examine(body) {
        return { state: 'error', info: 'Not implemented' };
    }
};
exports.BuyService = BuyService;
exports.BuyService = BuyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BuyService);
//# sourceMappingURL=buy.service.js.map