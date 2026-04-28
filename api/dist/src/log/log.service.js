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
exports.LogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LogService = class LogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page, limit, info, user: searchUser, startTime, endTime } = body;
        const where = {};
        if (user.userId !== 1) {
            where.user = user.userId;
        }
        if (info) {
            where.info = { contains: info };
        }
        if (searchUser) {
            if (!isNaN(Number(searchUser))) {
                where.user = Number(searchUser);
            }
        }
        if (startTime) {
            const start = Number(startTime);
            if (!isNaN(start)) {
                where.time = { gte: start };
            }
        }
        if (endTime) {
            const end = Number(endTime);
            if (!isNaN(end)) {
                if (where.time) {
                    where.time.lte = end;
                }
                else {
                    where.time = { lte: end };
                }
            }
        }
        const count = await this.prisma.log.count({ where });
        const list = await this.prisma.log.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const userIds = [...new Set(list.map(l => l.user))];
        const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
        const infoList = list.map(item => ({
            ...item,
            userData: users.find(u => u.id === item.user)
        }));
        return { state: 'success', count, info: infoList };
    }
    async empty() {
        try {
            await this.prisma.log.deleteMany({});
            return { state: 'success' };
        }
        catch (e) {
            return { state: 'error', info: '内部错误,操作已撤销!' };
        }
    }
};
exports.LogService = LogService;
exports.LogService = LogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LogService);
//# sourceMappingURL=log.service.js.map