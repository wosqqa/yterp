"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tree_util_1 = require("../utils/tree.util");
const XLSX = __importStar(require("xlsx"));
const pinyin_1 = __importDefault(require("pinyin"));
let GoodsService = class GoodsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(body, user) {
        const { page, limit, name, number, spec, category, brand, data } = body;
        const where = {};
        if (name) {
            where.OR = [
                { name: { contains: name } },
                { py: { contains: name } }
            ];
        }
        if (number)
            where.number = { contains: number };
        if (spec)
            where.spec = { contains: spec };
        if (brand)
            where.brand = { contains: brand };
        if (data)
            where.data = { contains: data };
        if (category !== undefined && category !== null && category !== '') {
            const allCategories = await this.prisma.category.findMany();
            const raw = Array.isArray(category) ? category : [category];
            const roots = raw
                .map((v) => Number(v))
                .filter((v) => Number.isFinite(v) && v > 0);
            const idSet = new Set();
            roots.forEach((rootId) => {
                tree_util_1.TreeUtil.getTreeIds(allCategories, rootId).forEach((id) => idSet.add(Number(id)));
            });
            const categoryIds = [...idSet];
            categoryIds.length > 0 && (where.category = { in: categoryIds });
        }
        const count = await this.prisma.goods.count({ where });
        const list = await this.prisma.goods.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const categoryIds = [...new Set(list.map(item => item.category))];
        const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });
        const info = list.map(item => {
            const imgs = item.imgs ? JSON.parse(item.imgs) : [];
            const units = item.units ? JSON.parse(item.units) : [];
            const strategy = item.strategy ? JSON.parse(item.strategy) : [];
            const more = item.more ? JSON.parse(item.more) : {};
            const extension = {
                unit: item.unit === '-1' ? '多单位' : item.unit,
                type: item.type ? '服务商品' : '常规商品',
            };
            return {
                ...item,
                imgs,
                units,
                strategy,
                more,
                categoryData: categories.find(c => c.id === item.category) || null,
                extension
            };
        });
        return { state: 'success', count, info };
    }
    async save(body, user) {
        const { id, name, number, spec, category, brand, unit, buy, sell, retail, integral, code, location, stock, type, data, imgs, units, strategy, serial, batch, protect, threshold, more } = body;
        if (!name)
            return { state: 'error', info: '商品名称不能为空!' };
        const py = (0, pinyin_1.default)(name, { style: pinyin_1.default.STYLE_FIRST_LETTER }).flat().join('');
        const inputData = {
            name,
            py,
            number,
            spec,
            category: category ? Number(category) : 0,
            brand,
            unit,
            buy: buy ? Number(buy) : 0,
            sell: sell ? Number(sell) : 0,
            code,
            location,
            stock: stock ? Number(stock) : 0,
            type: type === 1 || type === '1' || type === true,
            data,
            imgs: typeof imgs === 'string' ? imgs : JSON.stringify(imgs || []),
            details: '',
            units: typeof units === 'string' ? units : JSON.stringify(units || []),
            strategy: typeof strategy === 'string' ? strategy : JSON.stringify(strategy || []),
            serial: serial === 1 || serial === '1' || serial === true,
            batch: batch === 1 || batch === '1' || batch === true,
            validity: false,
            protect: protect ? Number(protect) : 0,
            threshold: threshold ? Number(threshold) : 0,
            more: typeof more === 'string' ? more : JSON.stringify(more || []),
        };
        if (id) {
            await this.prisma.goods.update({
                where: { id: Number(id) },
                data: inputData
            });
        }
        else {
            await this.prisma.goods.create({
                data: inputData
            });
        }
        return { state: 'success' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const info = await this.prisma.goods.findUnique({ where: { id: Number(id) } });
            if (info) {
                try {
                    info.imgs = info.imgs ? JSON.parse(info.imgs) : [];
                }
                catch (e) {
                    info.imgs = [];
                }
                try {
                    info.units = info.units ? JSON.parse(info.units) : [];
                }
                catch (e) {
                    info.units = [];
                }
                try {
                    info.strategy = info.strategy ? JSON.parse(info.strategy) : [];
                }
                catch (e) {
                    info.strategy = [];
                }
                try {
                    info.more = info.more ? JSON.parse(info.more) : {};
                }
                catch (e) {
                    info.more = {};
                }
                return {
                    state: 'success',
                    info: {
                        ...info,
                        attr: [],
                        type: info.type ? 1 : 0,
                        serial: info.serial,
                        batch: info.batch,
                        validity: info.validity
                    }
                };
            }
            return { state: 'error', info: '数据不存在!' };
        }
        else {
            return { state: 'error', info: '传入参数不完整!' };
        }
    }
    async upload(file) {
        if (!file) {
            return { state: 'error', info: '传入数据不完整!' };
        }
        const filePath = `/static/upload/${file.filename}`;
        return { state: 'success', info: filePath };
    }
    async import(file, user) {
        if (!file)
            return { state: 'error', info: '传入数据不完整!' };
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        if (data.length > 0)
            data.shift();
        const sql = [];
        const errors = [];
        const getSys = async (names) => {
            const sys = await this.prisma.sys.findMany({ where: { name: { in: names } } });
            const result = {};
            sys.forEach(s => {
                try {
                    result[s.name] = JSON.parse(s.info);
                }
                catch (e) {
                    result[s.name] = [];
                }
            });
            return result;
        };
        const updateSys = async (name, info) => {
            await this.prisma.sys.updateMany({
                where: { name },
                data: { info: JSON.stringify(info) }
            });
        };
        const sysConfig = await getSys(['unit', 'brand']);
        if (!Array.isArray(sysConfig.unit))
            sysConfig.unit = [];
        if (!Array.isArray(sysConfig.brand))
            sysConfig.brand = [];
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowIndex = i + 2;
            if (!row['A']) {
                errors.push(`第 ${rowIndex} 行: 商品名称不能为空`);
                continue;
            }
            if (!row['D']) {
                errors.push(`第 ${rowIndex} 行: 商品类别不能为空`);
                continue;
            }
            const record = {
                name: row['A'] || '',
                py: (0, pinyin_1.default)(row['A'] || '', { style: pinyin_1.default.STYLE_FIRST_LETTER }).flat().join(''),
                number: row['B'] || '',
                spec: row['C'] || '',
                categoryName: row['D'] || '',
                brand: row['E'] || '',
                unit: row['F'] || '',
                buy: Number(row['G'] || 0),
                sell: Number(row['H'] || 0),
                code: row['K'] || '',
                location: row['L'] || '',
                stock: Number(row['M'] || 0),
                type: row['N'] === '服务商品' ? true : false,
                data: row['O'] || '',
                imgs: '[]',
                details: '',
                units: '[]',
                strategy: '[]',
                serial: false,
                batch: false,
                validity: false,
                protect: 0,
                threshold: 0,
                more: '[]'
            };
            sql.push(record);
        }
        if (errors.length > 0) {
            return { state: 'error', info: errors[0] };
        }
        const names = sql.map(r => r.name);
        const numbers = sql.map(r => r.number).filter(n => n);
        if (new Set(names).size !== names.length)
            return { state: 'error', info: '模板文件中存在重复的商品名称!' };
        if (new Set(numbers).size !== numbers.length)
            return { state: 'error', info: '模板文件中存在重复的商品编号!' };
        for (const item of sql) {
            let category = await this.prisma.category.findFirst({ where: { name: item.categoryName } });
            if (!category) {
                category = await this.prisma.category.create({
                    data: {
                        pid: 0,
                        name: item.categoryName,
                        sort: 99,
                        data: '自动创建|商品导入'
                    }
                });
            }
            item.category = category.id;
            delete item.categoryName;
            if (item.brand && !sysConfig.brand.includes(item.brand)) {
                sysConfig.brand.push(item.brand);
                await updateSys('brand', sysConfig.brand);
            }
            if (item.unit) {
                if (item.unit === '多单位' || item.unit === '-1') {
                    return { state: 'error', info: `商品[${item.name}]单位不可为“多单位”` };
                }
                if (!sysConfig.unit.includes(item.unit)) {
                    sysConfig.unit.push(item.unit);
                    await updateSys('unit', sysConfig.unit);
                }
            }
        }
        await this.prisma.goods.createMany({
            data: sql
        });
        return { state: 'success', info: `成功导入 ${sql.length} 行商品数据` };
    }
    async exports(query) {
        const { parm } = query;
        if (!parm)
            return { state: 'error', info: '传入数据不完整!' };
        const ids = Array.isArray(parm) ? parm.map(Number) : (typeof parm === 'string' ? parm.split(',').map(Number) : []);
        if (ids.length === 0)
            return { state: 'error', info: '请选择要导出的数据' };
        const list = await this.prisma.goods.findMany({
            where: { id: { in: ids } },
            orderBy: { id: 'desc' }
        });
        const categoryIds = [...new Set(list.map(item => item.category))];
        const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });
        const excelData = list.map(item => {
            const category = categories.find(c => c.id === item.category);
            let imgUrl = '';
            try {
                const imgs = JSON.parse(item.imgs);
                if (imgs && imgs.length > 0)
                    imgUrl = imgs[0].url;
            }
            catch (e) { }
            return [
                imgUrl,
                item.name,
                item.number,
                item.spec,
                category ? category.name : '',
                item.brand,
                item.unit,
                Number(item.buy),
                Number(item.sell),
                0,
                0,
                item.code,
                item.location,
                Number(item.stock),
                item.type ? '服务商品' : '常规商品',
                '',
                item.data,
                '',
                item.serial ? '是' : '否',
                item.batch ? '是' : '否',
                item.protect,
                item.threshold
            ];
        });
        const headers = [
            '商品图像', '商品名称', '商品编号', '规格型号', '商品类别', '商品品牌', '商品单位',
            '采购价格', '销售价格', '零售价格', '兑换积分', '商品条码', '商品货位', '库存阈值',
            '商品类型', '辅助属性', '备注信息', '零售名称', '序列商品', '批次商品', '保质期', '预警阀值'
        ];
        excelData.unshift(headers);
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '商品信息');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return { state: 'success', buffer };
    }
};
exports.GoodsService = GoodsService;
exports.GoodsService = GoodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoodsService);
//# sourceMappingURL=goods.service.js.map