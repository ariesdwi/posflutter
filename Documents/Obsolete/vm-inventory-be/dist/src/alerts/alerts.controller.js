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
exports.AlertsController = void 0;
const common_1 = require("@nestjs/common");
const alerts_service_1 = require("./alerts.service");
const alerts_scheduler_1 = require("./alerts.scheduler");
const create_alert_rule_dto_1 = require("./dto/create-alert-rule.dto");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AlertsController = class AlertsController {
    constructor(alertsService, alertsScheduler) {
        this.alertsService = alertsService;
        this.alertsScheduler = alertsScheduler;
    }
    findAll() {
        return this.alertsService.findAll();
    }
    findOne(id) {
        return this.alertsService.findOne(id);
    }
    create(dto) {
        return this.alertsService.create(dto);
    }
    update(id, dto) {
        return this.alertsService.update(id, dto);
    }
    remove(id) {
        return this.alertsService.remove(id);
    }
    triggerNow() {
        return this.alertsScheduler.runNow();
    }
};
exports.AlertsController = AlertsController;
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'VIEWER'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'VIEWER'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_alert_rule_dto_1.CreateAlertRuleDto]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_alert_rule_dto_1.CreateAlertRuleDto]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)('trigger'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "triggerNow", null);
exports.AlertsController = AlertsController = __decorate([
    (0, common_1.Controller)('alerts'),
    __metadata("design:paramtypes", [alerts_service_1.AlertsService,
        alerts_scheduler_1.AlertsScheduler])
], AlertsController);
//# sourceMappingURL=alerts.controller.js.map