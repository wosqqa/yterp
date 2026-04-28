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
exports.BorController = void 0;
const common_1 = require("@nestjs/common");
const bor_service_1 = require("./bor.service");
const swagger_1 = require("@nestjs/swagger");
let BorController = class BorController {
    borService;
    constructor(borService) {
        this.borService = borService;
    }
    record(body, req) {
        req.user = { userId: 1, role: 1, frame: 1 };
        return this.borService.record(body, req.user);
    }
    save(body, req) {
        req.user = { userId: 1, role: 1, frame: 1 };
        return this.borService.save(body, req.user);
    }
};
exports.BorController = BorController;
__decorate([
    (0, common_1.Post)('record'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Bor List' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BorController.prototype, "record", null);
__decorate([
    (0, common_1.Post)('save'),
    (0, swagger_1.ApiOperation)({ summary: 'Save Bor' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BorController.prototype, "save", null);
exports.BorController = BorController = __decorate([
    (0, swagger_1.ApiTags)('bor'),
    (0, common_1.Controller)('bor'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [bor_service_1.BorService])
], BorController);
//# sourceMappingURL=bor.controller.js.map