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
exports.AttributeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AttributeService = class AttributeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body) {
        const { page = 1, limit = 10, name, data } = body;
        const where = {};
        if (name)
            where.name = { contains: name };
        if (data)
            where.data = { contains: data };
        const count = await this.prisma.attribute.count({ where });
        const list = await this.prisma.attribute.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { sort: 'asc' },
        });
        return { state: 'success', count, info: list };
    }
    async save(body) {
        const { id, name, sort, data, info } = body;
        if (!name)
            return { state: 'error', info: '传入参数不完整!' };
        const inputData = {
            name,
            sort: sort ? Number(sort) : 0,
            data: data || ''
        };
        if (id) {
            await this.prisma.attribute.update({
                where: { id: Number(id) },
                data: inputData
            });
            await this.prisma.attributeInfo.deleteMany({ where: { pid: Number(id) } });
            if (info && Array.isArray(info)) {
                const infoData = info.map((item) => ({
                    pid: Number(id),
                    name: item.name
                }));
                await this.prisma.attributeInfo.createMany({ data: infoData });
            }
        }
        else {
            const created = await this.prisma.attribute.create({
                data: inputData
            });
            if (info && Array.isArray(info)) {
                const infoData = info.map((item) => ({
                    pid: created.id,
                    name: item.name
                }));
                await this.prisma.attributeInfo.createMany({ data: infoData });
            }
        }
        return { state: 'success' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.attribute.findUnique({ where: { id: Number(id) } });
            if (info) {
                const details = await this.prisma.attributeInfo.findMany({ where: { pid: Number(id) } });
                return {
                    state: 'success',
                    info: { ...info, info: details }
                };
            }
            return { state: 'error', info: '数据不存在!' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { id } = body;
        if (id) {
            await this.prisma.attributeInfo.deleteMany({ where: { pid: Number(id) } });
            await this.prisma.attribute.delete({ where: { id: Number(id) } });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async select() {
        const attributes = await this.prisma.attribute.findMany({
            orderBy: { sort: 'asc' },
        });
        const attributeIds = attributes.map((attr) => attr.id);
        const infos = await this.prisma.attributeInfo.findMany({
            where: { pid: { in: attributeIds } },
        });
        const info = attributes.map((attr) => {
            return {
                ...attr,
                info: infos.filter((i) => i.pid === attr.id),
            };
        });
        return { state: 'success', info };
    }
};
exports.AttributeService = AttributeService;
exports.AttributeService = AttributeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttributeService);
//# sourceMappingURL=attribute.service.js.map