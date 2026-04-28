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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const sys_service_1 = require("../sys/sys.service");
const swagger_1 = require("@nestjs/swagger");
let AuthController = class AuthController {
    authService;
    sysService;
    constructor(authService, sysService) {
        this.authService = authService;
        this.sysService = sysService;
    }
    async captcha() {
        return this.authService.createCaptcha();
    }
    async runData(req) {
        let token = req.headers.authorization?.replace('Bearer ', '') || '';
        if (!token) {
            token = req.headers.token || '';
        }
        const isLogin = await this.authService.checkLogin(token);
        const sysConfig = await this.sysService.getSys(['name', 'company', 'icp', 'notice']);
        return {
            state: 'success',
            info: {
                login: isLogin,
                sys: sysConfig,
                ver: '7.4.1'
            }
        };
    }
    async login(req) {
        return this.authService.login(req.user);
    }
    getProfile(req) {
        return req.user;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('captcha'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Captcha' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "captcha", null);
__decorate([
    (0, common_1.Post)('runData'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Run Data' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "runData", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('local')),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'User Login' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                user: { type: 'string', example: 'admin' },
                pwd: { type: 'string', example: '123456' },
                uuid: { type: 'string', example: 'uuid-string' }
            }
        }
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Current User Profile' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('api'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        sys_service_1.SysService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map