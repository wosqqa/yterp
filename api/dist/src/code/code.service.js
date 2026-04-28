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
exports.CodeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CodeService = class CodeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body) {
        const { page = 1, limit = 10, name, info, type, data } = body;
        const where = {};
        if (name)
            where.name = { contains: name };
        if (info)
            where.info = { contains: info };
        if (data)
            where.data = { contains: data };
        if (type !== undefined && type !== '') {
            where.type = type === '1' || type === 1 || type === true;
        }
        const count = await this.prisma.code.count({ where });
        const list = await this.prisma.code.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const result = list.map(item => ({
            ...item,
            type: item.type ? 1 : 0,
            extension: {
                type: item.type ? '二维码' : '条形码'
            }
        }));
        return { state: 'success', count, info: result };
    }
    async save(body) {
        const { id, name, info, type, data } = body;
        const inputData = {
            name,
            info,
            type: type === '1' || type === 1 || type === true,
            data: data || ''
        };
        if (id) {
            await this.prisma.code.update({
                where: { id: Number(id) },
                data: inputData
            });
        }
        else {
            await this.prisma.code.create({
                data: inputData
            });
        }
        return { state: 'success' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.code.findUnique({ where: { id: Number(id) } });
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
        const { parm } = body;
        if (parm && Array.isArray(parm)) {
            const ids = parm.map(id => Number(id));
            await this.prisma.code.deleteMany({
                where: { id: { in: ids } }
            });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
};
exports.CodeService = CodeService;
exports.CodeService = CodeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CodeService);
//# sourceMappingURL=code.service.js.map