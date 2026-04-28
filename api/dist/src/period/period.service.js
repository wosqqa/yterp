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
exports.PeriodService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PeriodService = class PeriodService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page, limit } = body;
        const where = {};
        const count = await this.prisma.period.count({ where });
        const list = await this.prisma.period.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const userIds = [...new Set(list.map(p => p.user))];
        const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
        const info = list.map(item => ({
            ...item,
            userData: users.find(u => u.id === item.user)
        }));
        return { state: 'success', count, info };
    }
    async save(body, user) {
        const { date } = body;
        if (date) {
            const periodTime = await this.getPeriod();
            const dateTime = new Date(date).getTime() / 1000;
            if (dateTime > periodTime) {
                await this.prisma.period.create({
                    data: {
                        date: dateTime,
                        time: Math.floor(Date.now() / 1000),
                        user: user.userId
                    }
                });
                return { state: 'success' };
            }
            else {
                return { state: 'error', info: '结账周期不正确!' };
            }
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async back() {
        const period = await this.getPeriod();
        await this.prisma.period.deleteMany({
            where: { date: period }
        });
        return { state: 'success' };
    }
    async getPeriod() {
        const last = await this.prisma.period.findFirst({
            orderBy: { date: 'desc' }
        });
        return last ? last.date : 0;
    }
};
exports.PeriodService = PeriodService;
exports.PeriodService = PeriodService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PeriodService);
//# sourceMappingURL=period.service.js.map