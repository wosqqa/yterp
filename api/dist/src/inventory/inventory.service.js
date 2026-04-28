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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    add(a, b) {
        return Number(a) + Number(b);
    }
    mul(a, b) {
        return Number(a) * Number(b);
    }
    async record(body) {
        return { state: 'success', count: 0, info: [], column: [] };
    }
    async exports(query) {
        return { state: 'error', info: '暂未实现' };
    }
    async buildEntry(body) {
        const { info } = body || {};
        if (!Array.isArray(info))
            return { state: 'error', info: '传入参数不完整!' };
        const goodsIds = [...new Set(info.map((i) => Number(i.goods)))];
        const warehouseIds = [...new Set(info.map((i) => Number(i.warehouse)))];
        const goodsList = await this.prisma.goods.findMany({ where: { id: { in: goodsIds } } });
        const warehouseList = await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } });
        const goodsMap = new Map(goodsList.map((g) => [g.id, g]));
        const warehouseMap = new Map(warehouseList.map((w) => [w.id, w]));
        const resultInfo = [];
        let totalAmount = 0;
        for (const i of info) {
            const goods = goodsMap.get(Number(i.goods));
            if (!goods)
                continue;
            const warehouseData = warehouseMap.get(Number(i.warehouse)) || null;
            const price = Number(goods.buy);
            const nums = Number(i.nums);
            const total = this.mul(price, nums);
            resultInfo.push({
                goods: Number(i.goods),
                goodsData: goods,
                attr: i.attr || '',
                unit: i.unit || '',
                warehouse: Number(i.warehouse),
                warehouseData,
                batch: '',
                mfd: '',
                price,
                nums,
                serial: [],
                total,
                data: '',
            });
            totalAmount = this.add(totalAmount, total);
        }
        return { state: 'success', info: { class: { total: totalAmount, type: 1 }, info: resultInfo } };
    }
    async buildExtry(body) {
        const { info } = body || {};
        if (!Array.isArray(info))
            return { state: 'error', info: '传入参数不完整!' };
        const goodsIds = [...new Set(info.map((i) => Number(i.goods)))];
        const warehouseIds = [...new Set(info.map((i) => Number(i.warehouse)))];
        const goodsList = await this.prisma.goods.findMany({ where: { id: { in: goodsIds } } });
        const warehouseList = await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } });
        const goodsMap = new Map(goodsList.map((g) => [g.id, g]));
        const warehouseMap = new Map(warehouseList.map((w) => [w.id, w]));
        const resultInfo = [];
        let totalAmount = 0;
        for (const i of info) {
            const goods = goodsMap.get(Number(i.goods));
            if (!goods)
                continue;
            const warehouseData = warehouseMap.get(Number(i.warehouse)) || null;
            const price = Number(goods.buy);
            const nums = Math.abs(Number(i.nums));
            const total = this.mul(price, nums);
            resultInfo.push({
                goods: Number(i.goods),
                goodsData: goods,
                attr: i.attr || '',
                unit: i.unit || '',
                warehouse: Number(i.warehouse),
                warehouseData,
                batch: '',
                mfd: '',
                price,
                nums,
                serial: [],
                total,
                data: '',
            });
            totalAmount = this.add(totalAmount, total);
        }
        return { state: 'success', info: { class: { total: totalAmount, type: 1 }, info: resultInfo } };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map