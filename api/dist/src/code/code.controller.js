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
exports.CodeController = void 0;
const common_1 = require("@nestjs/common");
const code_service_1 = require("./code.service");
const passport_1 = require("@nestjs/passport");
let CodeController = class CodeController {
    codeService;
    constructor(codeService) {
        this.codeService = codeService;
    }
    record(body) {
        return this.codeService.record(body);
    }
    save(body) {
        return this.codeService.save(body);
    }
    get(body) {
        return this.codeService.get(body);
    }
    del(body) {
        return this.codeService.del(body);
    }
};
exports.CodeController = CodeController;
__decorate([
    (0, common_1.Post)('record'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CodeController.prototype, "record", null);
__decorate([
    (0, common_1.Post)('save'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CodeController.prototype, "save", null);
__decorate([
    (0, common_1.Post)('get'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CodeController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('del'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CodeController.prototype, "del", null);
exports.CodeController = CodeController = __decorate([
    (0, common_1.Controller)('code'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [code_service_1.CodeService])
], CodeController);
//# sourceMappingURL=code.controller.js.map