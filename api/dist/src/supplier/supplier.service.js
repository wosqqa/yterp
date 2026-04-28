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
exports.SupplierService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SupplierService = class SupplierService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page, limit, name, number, tel, category, user: searchUser, data } = body;
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
        if (searchUser)
            where.user = Number(searchUser);
        if (data)
            where.data = { contains: data };
        const count = await this.prisma.supplier.count({ where });
        const list = await this.prisma.supplier.findMany({
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
    async save(body, user) {
        const { id, name, number, category, rate, bank, account, tax, data, contacts, more } = body;
        if (id !== undefined) {
            const inputData = {
                name,
                number,
                category,
                rate: rate ? Number(rate) : 0,
                bank,
                account,
                tax,
                data,
                contacts: typeof contacts === 'string' ? contacts : JSON.stringify(contacts || []),
                more: typeof more === 'string' ? more : JSON.stringify(more || []),
                py: name
            };
            if (!id || id == 0) {
                inputData.frame = user.frame;
                inputData.user = user.userId;
                inputData.balance = 0;
                await this.prisma.supplier.create({ data: inputData });
            }
            else {
                await this.prisma.supplier.update({
                    where: { id: Number(id) },
                    data: inputData
                });
            }
            return { state: 'success' };
        }
        else {
            return { state: 'error', info: '传入参数不完整!' };
        }
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.supplier.findUnique({ where: { id: Number(id) } });
            if (info) {
                try {
                    info.contacts = info.contacts ? JSON.parse(info.contacts) : [];
                }
                catch (e) {
                    info.contacts = [];
                }
                try {
                    info.more = info.more ? JSON.parse(info.more) : {};
                }
                catch (e) {
                    info.more = {};
                }
                return { state: 'success', info };
            }
            return { state: 'error', info: '数据不存在!' };
        }
        else {
            return { state: 'error', info: '传入参数不完整!' };
        }
    }
    async del(body, user) {
        const { parm } = body;
        if (parm && Array.isArray(parm)) {
            await this.prisma.supplier.deleteMany({
                where: { id: { in: parm.map(Number) } }
            });
            return { state: 'success' };
        }
        else {
            return { state: 'error', info: '传入参数不完整!' };
        }
    }
};
exports.SupplierService = SupplierService;
exports.SupplierService = SupplierService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupplierService);
//# sourceMappingURL=supplier.service.js.map