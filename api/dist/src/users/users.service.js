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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(username) {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { user: username },
                    { tel: username }
                ]
            },
        });
    }
    async record(body, currentUser) {
        const { page, limit, name, user, tel, data } = body;
        const where = {};
        if (currentUser.userId !== 1) {
            where.frame = currentUser.frame;
        }
        if (name)
            where.name = { contains: name };
        if (user)
            where.user = { contains: user };
        if (tel)
            where.tel = { contains: tel };
        if (data)
            where.data = { contains: data };
        const count = await this.prisma.user.count({ where });
        const list = await this.prisma.user.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { id: 'desc' },
        });
        const frameIds = [...new Set(list.map(item => item.frame))];
        const roleIds = [...new Set(list.map(item => item.role))];
        const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });
        const roles = await this.prisma.role.findMany({ where: { id: { in: roleIds } } });
        const info = list.map(item => {
            const { pwd, ...rest } = item;
            return {
                ...rest,
                frameData: frames.find(f => f.id === item.frame) || null,
                roleData: roles.find(r => r.id === item.role) || null,
            };
        });
        return { state: 'success', count, info };
    }
    async save(body, currentUser) {
        const { id, name, user, pwd, role, frame, tel, note, data, status, more, img, expire } = body;
        const inputData = {
            name,
            user,
            tel,
            data: data || note || '',
            role: role ? Number(role) : 0,
            frame: frame ? Number(frame) : 0,
            py: name,
            img: img || '',
            expire: expire ? Number(expire) : 0,
            more: typeof more === 'string' ? more : JSON.stringify(more || {}),
        };
        if (pwd) {
            inputData.pwd = crypto.createHash('md5').update(pwd).digest('hex');
        }
        if (id) {
            if (!pwd) {
                delete inputData.pwd;
            }
            await this.prisma.user.update({
                where: { id: Number(id) },
                data: inputData
            });
        }
        else {
            if (!pwd) {
                return { state: 'error', info: '密码不能为空!' };
            }
            const exists = await this.prisma.user.findFirst({ where: { user } });
            if (exists) {
                return { state: 'error', info: '用户名已存在!' };
            }
            await this.prisma.user.create({ data: inputData });
        }
        return { state: 'success' };
    }
    async get(body) {
        const { id } = body;
        if (id) {
            const user = await this.prisma.user.findUnique({ where: { id: Number(id) } });
            if (user) {
                const { pwd, ...rest } = user;
                return { state: 'success', info: rest };
            }
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
    async del(body) {
        const { id } = body;
        if (id) {
            if (Number(id) === 1) {
                return { state: 'error', info: '超级管理员不能删除!' };
            }
            await this.prisma.user.delete({ where: { id: Number(id) } });
            return { state: 'success' };
        }
        return { state: 'error', info: '传入参数不完整!' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map