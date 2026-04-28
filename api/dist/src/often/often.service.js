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
exports.OftenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OftenService = class OftenService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(user) {
        const userId = user.userId;
        const info = await this.prisma.often.findMany({
            where: { user: userId }
        });
        return { state: 'success', info };
    }
    async save(body, user) {
        const { parm } = body;
        const userId = user.userId;
        if (parm && Array.isArray(parm)) {
            await this.prisma.$transaction(async (prisma) => {
                await prisma.often.deleteMany({
                    where: { user: userId }
                });
                if (parm.length > 0) {
                    const data = parm.map((item) => ({
                        user: userId,
                        name: item.name,
                        key: item.key
                    }));
                    await prisma.often.createMany({
                        data
                    });
                }
            });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
};
exports.OftenService = OftenService;
exports.OftenService = OftenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OftenService);
//# sourceMappingURL=often.service.js.map