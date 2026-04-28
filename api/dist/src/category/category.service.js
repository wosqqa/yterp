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
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoryService = class CategoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record() {
        const list = await this.prisma.category.findMany({
            orderBy: { sort: 'asc' }
        });
        const tree = this.hTree(list);
        return { state: 'success', info: tree };
    }
    async save(body) {
        const { id, pid, name, sort, data } = body;
        if (name) {
            if (id) {
                if (Number(pid) === Number(id)) {
                    return { state: 'error', info: '所属类别选择不正确!' };
                }
                const all = await this.prisma.category.findMany();
                const childrenIds = this.getTreeIds(all, Number(id));
                if (childrenIds.includes(Number(pid))) {
                    return { state: 'error', info: '所属类别选择不正确!' };
                }
                await this.prisma.category.update({
                    where: { id: Number(id) },
                    data: {
                        pid: Number(pid),
                        name,
                        sort: sort ? Number(sort) : 0,
                        data: data || ''
                    }
                });
            }
            else {
                await this.prisma.category.create({
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
        return { state: 'error', info: '传入参数不完整!' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.category.findUnique({ where: { id: Number(id) } });
            return { state: 'success', info };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { id } = body;
        if (id) {
            const children = await this.prisma.category.findFirst({ where: { pid: Number(id) } });
            if (children) {
                return { state: 'error', info: '存在子数据,删除失败!' };
            }
            const goods = await this.prisma.goods.findFirst({ where: { category: Number(id) } });
            if (goods) {
                return { state: 'error', info: '存在数据关联,删除失败!' };
            }
            await this.prisma.category.delete({ where: { id: Number(id) } });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    hTree(data, pid = 0) {
        const tree = [];
        data.forEach((item) => {
            if (item.pid === pid) {
                const children = this.hTree(data, item.id);
                const node = { ...item, sub: children };
                tree.push(node);
            }
        });
        return tree;
    }
    getTreeIds(data, pid) {
        let ids = [];
        data.forEach((item) => {
            if (item.pid === pid) {
                ids.push(item.id);
                ids = ids.concat(this.getTreeIds(data, item.id));
            }
        });
        return ids;
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoryService);
//# sourceMappingURL=category.service.js.map