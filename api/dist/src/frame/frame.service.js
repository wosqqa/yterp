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
exports.FrameService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tree_util_1 = require("../utils/tree.util");
let FrameService = class FrameService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record() {
        const frames = await this.prisma.frame.findMany({
            orderBy: { sort: 'asc' },
        });
        const info = tree_util_1.TreeUtil.hTree(frames, 0);
        return { state: 'success', info };
    }
    async save(body) {
        const { id, pid, name, sort, data } = body;
        if (id) {
            if (Number(id) === Number(pid)) {
                return { state: 'error', info: '所属组织选择不正确!' };
            }
            const children = await this.getAllChildrenIds(Number(id));
            if (children.includes(Number(pid))) {
                return { state: 'error', info: '所属组织选择不正确!' };
            }
            await this.prisma.frame.update({
                where: { id: Number(id) },
                data: {
                    pid: Number(pid),
                    name,
                    sort: sort ? Number(sort) : 0,
                    data
                }
            });
        }
        else {
            await this.prisma.frame.create({
                data: {
                    pid: Number(pid),
                    name,
                    sort: sort ? Number(sort) : 0,
                    data: data || ''
                }
            });
        }
        return { state: 'success' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.frame.findUnique({ where: { id: Number(id) } });
            return { state: 'success', info };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { id } = body;
        if (id) {
            const children = await this.prisma.frame.findFirst({ where: { pid: Number(id) } });
            if (children) {
                return { state: 'error', info: '存在子数据,删除失败!' };
            }
            const user = await this.prisma.user.findFirst({ where: { frame: Number(id) } });
            if (user)
                return { state: 'error', info: '存在数据关联,删除失败!' };
            const customer = await this.prisma.customer.findFirst({ where: { frame: Number(id) } });
            if (customer)
                return { state: 'error', info: '存在数据关联,删除失败!' };
            const supplier = await this.prisma.supplier.findFirst({ where: { frame: Number(id) } });
            if (supplier)
                return { state: 'error', info: '存在数据关联,删除失败!' };
            await this.prisma.frame.delete({ where: { id: Number(id) } });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async getAllChildrenIds(id) {
        const children = await this.prisma.frame.findMany({ where: { pid: id } });
        let ids = children.map(c => c.id);
        for (const child of children) {
            ids = [...ids, ...(await this.getAllChildrenIds(child.id))];
        }
        return ids;
    }
};
exports.FrameService = FrameService;
exports.FrameService = FrameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FrameService);
//# sourceMappingURL=frame.service.js.map