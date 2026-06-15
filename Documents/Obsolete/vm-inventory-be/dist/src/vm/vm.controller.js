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
exports.VmController = void 0;
const common_1 = require("@nestjs/common");
const vm_service_1 = require("./vm.service");
const create_vm_dto_1 = require("./dto/create-vm.dto");
const update_vm_dto_1 = require("./dto/update-vm.dto");
const query_vm_dto_1 = require("./dto/query-vm.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let VmController = class VmController {
    constructor(vmService) {
        this.vmService = vmService;
    }
    getStats() {
        return this.vmService.getStats();
    }
    findExpiring(days) {
        return this.vmService.findExpiring(days);
    }
    findAll(query) {
        return this.vmService.findAll(query);
    }
    findOne(id) {
        return this.vmService.findOne(id);
    }
    create(dto) {
        return this.vmService.create(dto);
    }
    update(id, dto, req) {
        return this.vmService.update(id, dto, req.user);
    }
    remove(id, req) {
        return this.vmService.remove(id, req.user);
    }
};
exports.VmController = VmController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VmController.prototype, "getStats", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('expiring'),
    __param(0, (0, common_1.Query)('days', new common_1.DefaultValuePipe(90), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VmController.prototype, "findExpiring", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vm_dto_1.QueryVmDto]),
    __metadata("design:returntype", void 0)
], VmController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VmController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'VIEWER'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vm_dto_1.CreateVmDto]),
    __metadata("design:returntype", void 0)
], VmController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'VIEWER'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_vm_dto_1.UpdateVmDto, Object]),
    __metadata("design:returntype", void 0)
], VmController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], VmController.prototype, "remove", null);
exports.VmController = VmController = __decorate([
    (0, common_1.Controller)('vms'),
    __metadata("design:paramtypes", [vm_service_1.VmService])
], VmController);
//# sourceMappingURL=vm.controller.js.map