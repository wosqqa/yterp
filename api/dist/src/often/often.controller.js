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
exports.OftenController = void 0;
const common_1 = require("@nestjs/common");
const often_service_1 = require("./often.service");
const passport_1 = require("@nestjs/passport");
let OftenController = class OftenController {
    oftenService;
    constructor(oftenService) {
        this.oftenService = oftenService;
    }
    record(req) {
        return this.oftenService.record(req.user);
    }
    save(body, req) {
        return this.oftenService.save(body, req.user);
    }
};
exports.OftenController = OftenController;
__decorate([
    (0, common_1.Post)('record'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OftenController.prototype, "record", null);
__decorate([
    (0, common_1.Post)('save'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OftenController.prototype, "save", null);
exports.OftenController = OftenController = __decorate([
    (0, common_1.Controller)('often'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [often_service_1.OftenService])
], OftenController);
//# sourceMappingURL=often.controller.js.map