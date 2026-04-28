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
exports.PeopleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PeopleService = class PeopleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page, limit, name, number, tel, add, card, sex, data } = body;
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
            where.tel = { contains: tel };
        if (add)
            where.add = { contains: add };
        if (card)
            where.card = { contains: card };
        if (sex !== undefined && sex !== '') {
            where.sex = sex === '1' || sex === 1 || sex === true;
        }
        if (data)
            where.data = { contains: data };
        const count = await this.prisma.people.count({ where });
        const list = await this.prisma.people.findMany({
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
            extension: {
                sex: item.sex ? '男' : '女'
            }
        }));
        return { state: 'success', count, info };
    }
    async save(body, user) {
        const { id, name, number, sex, tel, add, card, data, more } = body;
        const inputData = {
            name,
            number,
            tel,
            add,
            card,
            sex: sex === '1' || sex === 1 || sex === true,
            data,
            more: typeof more === 'string' ? more : JSON.stringify(more || {}),
            py: name
        };
        if (id) {
            await this.prisma.people.update({
                where: { id: Number(id) },
                data: inputData
            });
        }
        else {
            inputData.frame = user.frame;
            await this.prisma.people.create({ data: inputData });
        }
        return { state: 'success' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.people.findUnique({ where: { id: Number(id) } });
            return { state: 'success', info };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { parm } = body;
        if (parm && Array.isArray(parm)) {
            await this.prisma.people.deleteMany({
                where: { id: { in: parm.map(Number) } }
            });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
};
exports.PeopleService = PeopleService;
exports.PeopleService = PeopleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PeopleService);
//# sourceMappingURL=people.service.js.map