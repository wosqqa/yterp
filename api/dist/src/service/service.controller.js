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
exports.ServiceController = void 0;
const common_1 = require("@nestjs/common");
const service_service_1 = require("./service.service");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let ServiceController = class ServiceController {
    serviceService;
    constructor(serviceService) {
        this.serviceService = serviceService;
    }
    out() {
        return { state: 'success' };
    }
    roleRecord(body) {
        return this.serviceService.roleRecord(body);
    }
    store(req) {
        req.user = { userId: 1, role: 0, frame: 0 };
        return this.serviceService.store(req.user);
    }
    getScene(body) {
        return this.serviceService.getScene(body);
    }
    userRecord(body, req) {
        return this.serviceService.userRecord(body, req.user);
    }
    goodsRecord(body, req) {
        return this.serviceService.goodsRecord(body, req.user);
    }
    accountRecord(body, req) {
        return this.serviceService.accountRecord(body, req.user);
    }
    supplierRecord(body, req) {
        return this.serviceService.supplierRecord(body, req.user);
    }
    peopleRecord(body, req) {
        return this.serviceService.peopleRecord(body, req.user);
    }
    customerRecord(body, req) {
        return this.serviceService.customerRecord(body, req.user);
    }
};
exports.ServiceController = ServiceController;
__decorate([
    (0, common_1.Post)('out'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "out", null);
__decorate([
    (0, common_1.Post)('roleRecord'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Role List' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "roleRecord", null);
__decorate([
    (0, common_1.Post)('store'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Store Data' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "store", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('getScene'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Scene Data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "getScene", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('userRecord'),
    (0, swagger_1.ApiOperation)({ summary: 'Get User List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "userRecord", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('goodsRecord'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Goods List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "goodsRecord", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('accountRecord'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Account List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "accountRecord", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('supplierRecord'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Supplier List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "supplierRecord", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('peopleRecord'),
    (0, swagger_1.ApiOperation)({ summary: 'Get People List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "peopleRecord", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('customerRecord'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Customer List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceController.prototype, "customerRecord", null);
exports.ServiceController = ServiceController = __decorate([
    (0, swagger_1.ApiTags)('service'),
    (0, common_1.Controller)('service'),
    __metadata("design:paramtypes", [service_service_1.ServiceService])
], ServiceController);
//# sourceMappingURL=service.controller.js.map