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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RoleService = class RoleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body) {
        const { page, limit, name, data } = body;
        const where = {};
        if (name)
            where.name = { contains: name };
        if (data)
            where.data = { contains: data };
        const count = await this.prisma.role.count({ where });
        const list = await this.prisma.role.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        return { state: 'success', count, info: list };
    }
    async save(body) {
        const { id, name, root, auth, data } = body;
        if (name) {
            if (id) {
                await this.prisma.role.update({
                    where: { id: Number(id) },
                    data: {
                        name,
                        root: typeof root === 'string' ? root : JSON.stringify(root || {}),
                        auth: typeof auth === 'string' ? auth : JSON.stringify(auth || {}),
                        data: data || ''
                    }
                });
            }
            else {
                await this.prisma.role.create({
                    data: {
                        name,
                        root: typeof root === 'string' ? root : JSON.stringify(root || {}),
                        auth: typeof auth === 'string' ? auth : JSON.stringify(auth || {}),
                        data: data || ''
                    }
                });
            }
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.role.findUnique({ where: { id: Number(id) } });
            if (info) {
                try {
                    info.root = JSON.parse(info.root);
                }
                catch (e) {
                    info.root = [];
                }
                try {
                    info.auth = JSON.parse(info.auth);
                }
                catch (e) {
                    info.auth = {};
                }
                return { state: 'success', info };
            }
            return { state: 'error', info: '数据不存在!' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { id } = body;
        if (id) {
            const user = await this.prisma.user.findFirst({ where: { role: Number(id) } });
            if (user)
                return { state: 'error', info: '存在数据关联,删除失败!' };
            await this.prisma.role.delete({ where: { id: Number(id) } });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoleService);
//# sourceMappingURL=role.service.js.map