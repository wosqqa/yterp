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
exports.IetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IetService = class IetService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body) {
        const { page = 1, limit = 10, name, type } = body;
        const where = {};
        if (name)
            where.name = { contains: name };
        if (type !== undefined && type !== '') {
            where.type = type === '1' || type === 1 || type === true;
        }
        const count = await this.prisma.iet.count({ where });
        const list = await this.prisma.iet.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: [
                { sort: 'asc' },
                { id: 'desc' }
            ],
        });
        const info = list.map(item => ({
            ...item,
            type: item.type ? 1 : 0,
            extension: {
                type: item.type ? '支出' : '收入'
            }
        }));
        return { state: 'success', count, info };
    }
    async save(body) {
        const { id, name, type, sort, data } = body;
        if (name) {
            const inputData = {
                name,
                type: type === '1' || type === 1 || type === true,
                sort: sort ? Number(sort) : 0,
                data: data || ''
            };
            if (id) {
                await this.prisma.iet.update({
                    where: { id: Number(id) },
                    data: inputData
                });
            }
            else {
                await this.prisma.iet.create({
                    data: inputData
                });
            }
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.iet.findUnique({ where: { id: Number(id) } });
            if (info) {
                return {
                    state: 'success',
                    info: {
                        ...info,
                        type: info.type ? 1 : 0
                    }
                };
            }
            return { state: 'error', info: '数据不存在!' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { id } = body;
        if (id) {
            const cost = await this.prisma.cost.findFirst({ where: { iet: Number(id) } });
            if (cost) {
                return { state: 'error', info: '存在数据关联,删除失败!' };
            }
            await this.prisma.iet.delete({ where: { id: Number(id) } });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
};
exports.IetService = IetService;
exports.IetService = IetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IetService);
//# sourceMappingURL=iet.service.js.map