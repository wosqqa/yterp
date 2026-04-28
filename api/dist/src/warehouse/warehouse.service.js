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
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WarehouseService = class WarehouseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page, limit, name, number, contacts, tel, add, data } = body;
        const where = {};
        if (user.userId !== 1) {
            where.frame = user.frame;
        }
        if (name)
            where.name = { contains: name };
        if (number)
            where.number = { contains: number };
        if (contacts)
            where.contacts = { contains: contacts };
        if (tel)
            where.tel = { contains: tel };
        if (add)
            where.add = { contains: add };
        if (data)
            where.data = { contains: data };
        const count = await this.prisma.warehouse.count({ where });
        const list = await this.prisma.warehouse.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const frameIds = [...new Set(list.map(item => item.frame))];
        const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });
        const info = list.map(item => ({
            ...item,
            frameData: frames.find(f => f.id === item.frame) || null,
        }));
        return { state: 'success', count, info };
    }
    async save(body, user) {
        const { id, name, number, contacts, tel, add, data } = body;
        if (!name)
            return { state: 'error', info: '仓库名称不能为空!' };
        const inputData = {
            name,
            number,
            contacts,
            tel,
            add,
            data,
        };
        if (id) {
            await this.prisma.warehouse.update({
                where: { id: Number(id) },
                data: inputData
            });
        }
        else {
            inputData.frame = user.frame;
            await this.prisma.warehouse.create({
                data: inputData
            });
        }
        return { state: 'success' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.warehouse.findUnique({ where: { id: Number(id) } });
            if (info) {
                return { state: 'success', info };
            }
            return { state: 'error', info: '数据不存在!' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { id } = body;
        if (id) {
            await this.prisma.warehouse.delete({ where: { id: Number(id) } });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehouseService);
//# sourceMappingURL=warehouse.service.js.map