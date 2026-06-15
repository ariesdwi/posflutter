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
exports.SummaryController = void 0;
const common_1 = require("@nestjs/common");
const summary_service_1 = require("./summary.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let SummaryController = class SummaryController {
    constructor(summaryService) {
        this.summaryService = summaryService;
    }
    async getManagementSummary() {
        return this.summaryService.getManagementSummary();
    }
    async getObsoleteSummary(osType) {
        if (!osType || !['Ubuntu', 'CentOS'].includes(osType)) {
            return {
                error: 'Please specify osType as Ubuntu or CentOS',
            };
        }
        return this.summaryService.getObsoleteSummary(osType);
    }
    async getAppDepartmentMapping(osType, category = 'Production') {
        if (!osType || !['Ubuntu', 'CentOS'].includes(osType)) {
            return {
                error: 'Please specify osType as Ubuntu or CentOS',
            };
        }
        return this.summaryService.getAppDepartmentMapping(osType, category);
    }
    async getSummaryByDepartment(osType) {
        if (osType && !['Ubuntu', 'CentOS'].includes(osType)) {
            return {
                error: 'osType must be Ubuntu or CentOS if provided',
            };
        }
        return this.summaryService.getSummaryByDepartment(osType);
    }
};
exports.SummaryController = SummaryController;
__decorate([
    (0, common_1.Get)('management'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SummaryController.prototype, "getManagementSummary", null);
__decorate([
    (0, common_1.Get)('obsolete'),
    __param(0, (0, common_1.Query)('osType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SummaryController.prototype, "getObsoleteSummary", null);
__decorate([
    (0, common_1.Get)('app-mapping'),
    __param(0, (0, common_1.Query)('osType')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SummaryController.prototype, "getAppDepartmentMapping", null);
__decorate([
    (0, common_1.Get)('by-department'),
    __param(0, (0, common_1.Query)('osType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SummaryController.prototype, "getSummaryByDepartment", null);
exports.SummaryController = SummaryController = __decorate([
    (0, common_1.Controller)('summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [summary_service_1.SummaryService])
], SummaryController);
//# sourceMappingURL=summary.controller.js.map