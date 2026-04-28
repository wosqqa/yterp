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
exports.ServiceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tree_util_1 = require("../utils/tree.util");
const client_1 = require("@prisma/client");
let ServiceService = class ServiceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async goodsRecord(body, user) {
        try {
            const { page, limit, category, code, brand, type, data } = body;
            const mate = body.mate ?? body.query;
            const pageNum = Number(page);
            const limitNum = Number(limit);
            if (!Number.isFinite(pageNum) || !Number.isFinite(limitNum) || pageNum < 1 || limitNum < 1) {
                return { state: 'error', info: '传入参数不完整!' };
            }
            const andWhere = [];
            const dataText = data !== undefined && data !== null ? String(data).trim() : '';
            const setOrderMode = !!dataText && /^set/i.test(dataText);
            let typeVal = null;
            let categoryFilterIds = [];
            let codePids = [];
            if (mate) {
                const q = String(mate);
                andWhere.push({
                    OR: [{ name: { contains: q } }, { py: { contains: q } }, { number: { contains: q } }, { spec: { contains: q } }],
                });
            }
            if (brand) {
                andWhere.push({ brand: String(brand) });
            }
            if (type !== undefined && type !== null && type !== '') {
                const t = Number(type);
                if (t === 1) {
                    typeVal = 0;
                    andWhere.push({ type: false });
                }
                if (t === 2) {
                    typeVal = 1;
                    andWhere.push({ type: true });
                }
            }
            if (dataText) {
                if (setOrderMode) {
                    andWhere.push({ data: { startsWith: dataText } });
                }
                else {
                    andWhere.push({ data: { contains: dataText } });
                }
            }
            if (category !== undefined && category !== null && category !== '') {
                const categories = await this.prisma.category.findMany();
                const raw = Array.isArray(category) ? category : [category];
                const roots = raw
                    .map((v) => Number(v))
                    .filter((v) => Number.isFinite(v) && v > 0);
                const idSet = new Set();
                roots.forEach((rootId) => {
                    tree_util_1.TreeUtil.getTreeIds(categories, rootId).forEach((id) => idSet.add(Number(id)));
                });
                categoryFilterIds = [...idSet].filter((v) => Number.isFinite(v) && v > 0);
                categoryFilterIds.length > 0 && andWhere.push({ category: { in: categoryFilterIds } });
            }
            if (code) {
                const barcode = String(code);
                const pidRows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT pid FROM is_attr WHERE code = ${barcode}`);
                codePids = pidRows.map((r) => Number(r.pid)).filter((v) => v);
                andWhere.push({
                    OR: [{ code: barcode }, ...(codePids.length > 0 ? [{ id: { in: codePids } }] : [])],
                });
            }
            const where = andWhere.length > 0 ? { AND: andWhere } : {};
            const skip = (Math.floor(pageNum) - 1) * Math.floor(limitNum);
            const take = Math.floor(limitNum);
            let count = 0;
            let list = [];
            if (setOrderMode) {
                const whereSqlParts = [];
                if (mate) {
                    const q = `%${String(mate)}%`;
                    whereSqlParts.push(client_1.Prisma.sql `(name LIKE ${q} OR py LIKE ${q} OR number LIKE ${q} OR spec LIKE ${q})`);
                }
                if (brand)
                    whereSqlParts.push(client_1.Prisma.sql `brand = ${String(brand)}`);
                if (typeVal !== null)
                    whereSqlParts.push(client_1.Prisma.sql `type = ${typeVal}`);
                if (dataText)
                    whereSqlParts.push(client_1.Prisma.sql `data LIKE ${dataText + '%'}`);
                if (categoryFilterIds.length > 0)
                    whereSqlParts.push(client_1.Prisma.sql `category IN (${client_1.Prisma.join(categoryFilterIds)})`);
                if (code) {
                    const barcode = String(code);
                    if (codePids.length > 0) {
                        whereSqlParts.push(client_1.Prisma.sql `(code = ${barcode} OR id IN (${client_1.Prisma.join(codePids)}))`);
                    }
                    else {
                        whereSqlParts.push(client_1.Prisma.sql `code = ${barcode}`);
                    }
                }
                const whereSql = whereSqlParts.length > 0 ? client_1.Prisma.sql `WHERE ${client_1.Prisma.join(whereSqlParts, ' AND ')}` : client_1.Prisma.empty;
                const countRows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT COUNT(*) AS cnt FROM is_goods ${whereSql}`);
                count = Number(countRows && countRows[0] ? countRows[0].cnt : 0) || 0;
                const idRows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT id FROM is_goods ${whereSql} ORDER BY CAST(SUBSTRING(data, 4) AS UNSIGNED) ASC, id DESC LIMIT ${take} OFFSET ${skip}`);
                const ids = idRows.map((r) => Number(r.id)).filter((v) => v);
                if (ids.length > 0) {
                    const rows = await this.prisma.goods.findMany({ where: { id: { in: ids } } });
                    const byId = new Map();
                    rows.forEach((r) => byId.set(Number(r.id), r));
                    list = ids.map((id) => byId.get(id)).filter((v) => v);
                }
                else {
                    list = [];
                }
            }
            else {
                count = await this.prisma.goods.count({ where });
                list = await this.prisma.goods.findMany({
                    where,
                    skip,
                    take,
                    orderBy: { id: 'desc' },
                });
            }
            const categoryIds = [...new Set(list.map((item) => item.category))];
            const categories = categoryIds.length > 0 ? await this.prisma.category.findMany({ where: { id: { in: categoryIds } } }) : [];
            const goodsIds = list.map((g) => g.id);
            const attrRows = goodsIds.length > 0
                ? await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT id, pid, name, buy, sell, code FROM is_attr WHERE pid IN (${client_1.Prisma.join(goodsIds)})`)
                : [];
            const attrsByPid = new Map();
            attrRows.forEach((a) => {
                const pid = Number(a.pid);
                if (!attrsByPid.has(pid))
                    attrsByPid.set(pid, []);
                attrsByPid.get(pid).push(a);
            });
            const info = list.map((item) => {
                let imgs = [];
                let units = [];
                let strategy = [];
                let more = {};
                try {
                    imgs = item.imgs ? JSON.parse(item.imgs) : [];
                }
                catch (e) {
                    imgs = [];
                }
                try {
                    units = item.units ? JSON.parse(item.units) : [];
                }
                catch (e) {
                    units = [];
                }
                try {
                    strategy = item.strategy ? JSON.parse(item.strategy) : [];
                }
                catch (e) {
                    strategy = [];
                }
                try {
                    more = item.more ? JSON.parse(item.more) : {};
                }
                catch (e) {
                    more = {};
                }
                const extension = {
                    unit: item.unit === '-1' ? '多单位' : item.unit,
                    type: item.type ? '服务商品' : '常规商品',
                };
                const categoryData = categories.find((c) => c.id === item.category) || null;
                let attr = (attrsByPid.get(item.id) || []).map((a) => {
                    return {
                        id: Number(a.id),
                        pid: Number(a.pid),
                        key: `${a.pid}.${a.id}`,
                        name: a.name,
                        buy: Number(a.buy),
                        sell: Number(a.sell),
                        retail: undefined,
                        code: a.code,
                        attr: '',
                    };
                });
                if (code) {
                    const barcode = String(code);
                    attr = attr.filter((a) => barcode === String(item.code) || barcode === String(a.code));
                }
                return {
                    ...item,
                    buy: Number(item.buy),
                    sell: Number(item.sell),
                    key: item.id,
                    imgs,
                    units,
                    strategy,
                    more,
                    categoryData,
                    extension,
                    attr,
                };
            });
            return { state: 'success', count, info };
        }
        catch (e) {
            return { state: 'error', info: e?.message || '内部错误' };
        }
    }
    async accountRecord(body, user) {
        const { page, limit, query } = body;
        const where = {};
        if (user.userId !== 1) {
            where.frame = user.frame;
        }
        if (query) {
            where.name = { contains: query };
        }
        const count = await this.prisma.account.count({ where });
        const list = await this.prisma.account.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        return { state: 'success', count, info: list };
    }
    async supplierRecord(body, user) {
        const { page, limit, query } = body;
        const where = {};
        if (user.userId !== 1) {
            where.frame = user.frame;
        }
        if (query) {
            where.OR = [
                { name: { contains: query } },
                { py: { contains: query } }
            ];
        }
        const count = await this.prisma.supplier.count({ where });
        const list = await this.prisma.supplier.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        return { state: 'success', count, info: list };
    }
    async peopleRecord(body, user) {
        const { page, limit, query, noAuth } = body;
        const where = {};
        if (!noAuth && user.userId !== 1) {
            where.frame = user.frame;
        }
        if (query) {
            where.OR = [
                { name: { contains: query } },
                { py: { contains: query } }
            ];
        }
        const count = await this.prisma.people.count({ where });
        const list = await this.prisma.people.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        return { state: 'success', count, info: list };
    }
    async store(user) {
        const frameFilter = user.role === 0 ? {} : { id: user.frame };
        const commonFilter = user.role === 0 ? {} : { frame: user.frame };
        let frames = await this.prisma.frame.findMany({
            where: user.role === 0 ? {} : {
                OR: [
                    { id: user.frame },
                    { pid: user.frame }
                ]
            },
            orderBy: { sort: 'asc' }
        });
        if (user.role !== 0) {
            frames = await this.prisma.frame.findMany({ where: { id: user.frame } });
        }
        else {
            frames = await this.prisma.frame.findMany({ orderBy: { sort: 'asc' } });
        }
        const frameTree = tree_util_1.TreeUtil.hTree(frames, 0);
        let root = 'all';
        let rootData = {};
        if (user.role !== 0) {
            const role = await this.prisma.role.findUnique({ where: { id: user.role } });
            if (role && role.root) {
                try {
                    const rootJson = JSON.parse(role.root);
                    if (Array.isArray(rootJson)) {
                        rootJson.forEach(item => {
                            rootData[item.module] = item.data;
                        });
                    }
                    root = rootData;
                }
                catch (e) {
                    root = {};
                }
            }
        }
        let menus = [];
        if (root === 'all') {
            menus = await this.prisma.menu.findMany({
                orderBy: { sort: 'asc' }
            });
        }
        else {
            const allMenus = await this.prisma.menu.findMany({
                where: {
                    id: { gt: 0 },
                    root: { not: 'admin' }
                },
                orderBy: { sort: 'asc' }
            });
            menus = allMenus.filter(menuVo => {
                if (!menuVo.root || menuVo.resource === '#group')
                    return true;
                const voRoot = menuVo.root.split('|');
                const module = voRoot[0];
                const type = voRoot.length === 1 ? 'see' : voRoot[1];
                if (rootData[module] && rootData[module][type]) {
                    return rootData[module][type] === true || rootData[module][type] === 'true';
                }
                return false;
            });
        }
        const fields = await this.prisma.field.findMany();
        const fieldMap = {};
        fields.forEach(f => {
            try {
                fieldMap[f.key] = JSON.parse(f.fields);
            }
            catch (e) {
                fieldMap[f.key] = [];
            }
        });
        const menuTree = tree_util_1.TreeUtil.hTree(menus, 0);
        const categories = await this.prisma.category.findMany({ orderBy: { sort: 'asc' } });
        const categoryTree = tree_util_1.TreeUtil.hTree(categories, 0);
        const warehouses = await this.prisma.warehouse.findMany({
            where: commonFilter
        });
        const accounts = await this.prisma.account.findMany({
            where: commonFilter
        });
        const iets = await this.prisma.iet.findMany({ orderBy: { sort: 'asc' } });
        const ietMap = { in: [], out: [] };
        iets.forEach(item => {
            if (item.type === false)
                ietMap.in.push(item);
            else
                ietMap.out.push(item);
        });
        const oftenList = await this.prisma.often.findMany({
            where: { user: user.userId }
        });
        const often = oftenList.map(item => item.key);
        const sysNames = [
            'name',
            'company',
            'icp',
            'notice',
            'brand',
            'unit',
            'crCategory',
            'crGrade',
            'srCategory',
            'fun',
            'logistics',
        ];
        const sysList = await this.prisma.sys.findMany({
            where: { name: { in: sysNames } }
        });
        const sys = {};
        sysList.forEach(item => {
            try {
                sys[item.name] = JSON.parse(item.info);
            }
            catch (e) {
                sys[item.name] = item.info;
            }
        });
        return {
            state: 'success',
            info: {
                frame: frameTree,
                menu: menuTree,
                fields: fieldMap,
                root: root,
                category: categoryTree,
                warehouse: warehouses,
                account: accounts,
                iet: ietMap,
                often: often,
                sys: {
                    logistics: [],
                    ...sys,
                }
            }
        };
    }
    async getScene(body) {
        const { id, scene } = body;
        if (id && scene) {
            const modelName = scene;
            if (!this.prisma[modelName]) {
                return { state: 'error', info: 'Invalid scene' };
            }
            const find = await this.prisma[modelName].findUnique({
                where: { id: Number(id) }
            });
            return { state: 'success', info: find };
        }
        else {
            return { state: 'error', info: '传入参数不完整!' };
        }
    }
    async roleRecord(body) {
        const { page, limit, query } = body;
        const where = {};
        if (query) {
            where.name = { contains: query };
        }
        const count = await this.prisma.role.count({ where });
        const list = await this.prisma.role.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        return { state: 'success', count, info: list };
    }
    async userRecord(body, user) {
        const { page, limit, query, noAuth } = body;
        const where = {};
        if (!noAuth && user.userId !== 1) {
            where.frame = user.frame;
        }
        if (query) {
            where.OR = [
                { name: { contains: query } },
                { py: { contains: query } }
            ];
        }
        const count = await this.prisma.user.count({ where });
        const list = await this.prisma.user.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        return { state: 'success', count, info: list };
    }
    async customerRecord(body, user) {
        const { page, limit, name, number, tel, category, grade, user: searchUser, data } = body;
        const where = {};
        if (user.userId !== 1) {
            where.frame = user.frame;
        }
        if (name) {
            where.OR = [
                { name: { contains: name } },
                { py: { contains: name } }
            ];
        }
        if (number)
            where.number = { contains: number };
        if (tel)
            where.contacts = { contains: tel };
        if (category)
            where.category = category;
        if (grade)
            where.grade = grade;
        if (searchUser)
            where.user = Number(searchUser);
        if (data)
            where.data = { contains: data };
        const count = await this.prisma.customer.count({ where });
        const list = await this.prisma.customer.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const frameIds = [...new Set(list.map(item => item.frame))].filter(id => typeof id === 'number');
        const userIds = [...new Set(list.map(item => item.user))].filter(id => typeof id === 'number');
        const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });
        const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
        const info = list.map(item => {
            let contacts = [];
            try {
                contacts = item.contacts ? JSON.parse(item.contacts) : [];
            }
            catch (e) { }
            let more = {};
            try {
                more = item.more ? JSON.parse(item.more) : {};
            }
            catch (e) { }
            let contactStr = '';
            if (contacts && contacts.length > 0) {
                const main = contacts.find((c) => c.main);
                if (main) {
                    contactStr = `${main.name} | ${main.tel} | ${main.add}`;
                }
            }
            const frameData = frames.find(f => f.id === item.frame) || null;
            const userData = users.find(u => u.id === item.user) || null;
            if (userData) {
                delete userData.pwd;
                delete userData.token;
            }
            return {
                ...item,
                balance: Number(item.balance),
                contacts,
                more,
                frameData,
                userData,
                extension: {
                    contact: contactStr
                }
            };
        });
        return { state: 'success', count, info };
    }
};
exports.ServiceService = ServiceService;
exports.ServiceService = ServiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServiceService);
//# sourceMappingURL=service.service.js.map