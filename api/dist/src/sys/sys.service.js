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
exports.SysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SysService = class SysService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSys(keys) {
        const where = {};
        if (keys && keys.length > 0) {
            where.name = { in: keys };
        }
        const sysList = await this.prisma.sys.findMany({ where });
        const info = {};
        for (const item of sysList) {
            try {
                info[item.name] = JSON.parse(item.info);
            }
            catch (e) {
                info[item.name] = item.info;
            }
        }
        return info;
    }
    async record() {
        const info = await this.getSys();
        return { state: 'success', info };
    }
    async save(body) {
        if (body && typeof body === 'object') {
            const keys = Object.keys(body);
            const sysRecords = await this.prisma.sys.findMany({
                where: { name: { in: keys } },
                select: { id: true, name: true }
            });
            const updatePromises = [];
            for (const record of sysRecords) {
                const val = body[record.name];
                let infoStr = val;
                if (typeof val === 'object') {
                    infoStr = JSON.stringify(val);
                }
                else {
                    infoStr = String(val);
                }
                updatePromises.push(this.prisma.sys.update({
                    where: { id: record.id },
                    data: { info: infoStr }
                }));
            }
            try {
                await this.prisma.$transaction(updatePromises);
                return { state: 'success' };
            }
            catch (e) {
                return { state: 'error', info: '内部错误,操作已撤销!' };
            }
        }
        else {
            return { state: 'error', info: '传入参数不完整!' };
        }
    }
};
exports.SysService = SysService;
exports.SysService = SysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SysService);
//# sourceMappingURL=sys.service.js.map