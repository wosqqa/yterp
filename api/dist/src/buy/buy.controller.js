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
exports.BuyController = void 0;
const common_1 = require("@nestjs/common");
const buy_service_1 = require("./buy.service");
const swagger_1 = require("@nestjs/swagger");
let BuyController = class BuyController {
    buyService;
    constructor(buyService) {
        this.buyService = buyService;
    }
    record(body, req) {
        req.user = { userId: 1, role: 1, frame: 1 };
        return this.buyService.record(body, req.user);
    }
    save(body, req) {
        req.user = { userId: 1, role: 1, frame: 1 };
        return this.buyService.save(body, req.user);
    }
    get(body) {
        return this.buyService.get(body);
    }
    del(body) {
        return this.buyService.del(body);
    }
    check(body) {
        return this.buyService.check(body);
    }
    examine(body) {
        return this.buyService.examine(body);
    }
};
exports.BuyController = BuyController;
__decorate([
    (0, common_1.Post)('record'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Buy List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BuyController.prototype, "record", null);
__decorate([
    (0, common_1.Post)('save'),
    (0, swagger_1.ApiOperation)({ summary: 'Save Buy' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BuyController.prototype, "save", null);
__decorate([
    (0, common_1.Post)('get'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Buy Details' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BuyController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('del'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete Buy' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BuyController.prototype, "del", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, swagger_1.ApiOperation)({ summary: 'Check Buy' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BuyController.prototype, "check", null);
__decorate([
    (0, common_1.Post)('examine'),
    (0, swagger_1.ApiOperation)({ summary: 'Examine Buy' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BuyController.prototype, "examine", null);
exports.BuyController = BuyController = __decorate([
    (0, swagger_1.ApiTags)('buy'),
    (0, common_1.Controller)('buy'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [buy_service_1.BuyService])
], BuyController);
//# sourceMappingURL=buy.controller.js.map