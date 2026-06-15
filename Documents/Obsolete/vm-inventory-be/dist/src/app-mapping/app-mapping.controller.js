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
exports.AppMappingController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const sync_1 = require("csv-parse/sync");
const app_mapping_service_1 = require("./app-mapping.service");
const query_app_mapping_dto_1 = require("./dto/query-app-mapping.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const VALID_DEPARTMENTS = new Set([
    'Core Development Department',
    'Corporate & Outlet Delivery Development Department',
    'Digital Ecosystem Development Department',
    'Digital Retail Development Department',
    'Digital Wholesale Development Department',
    'Enterprise Service Development Department',
    'Financial System Development Department',
    'IT Development Management Departement',
    'Middleware Development Department',
]);
let AppMappingController = class AppMappingController {
    constructor(service) {
        this.service = service;
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    getDashboard() {
        return this.service.getDashboard();
    }
    getTeams() {
        return this.service.getTeams();
    }
    getDepartments() {
        return this.service.getDepartments();
    }
    async importCsv(file, truncate) {
        if (!file)
            throw new common_1.BadRequestException('file is required');
        let records;
        try {
            records = (0, sync_1.parse)(file.buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true,
                relax_quotes: true,
                relax_column_count: true,
            });
        }
        catch {
            throw new common_1.BadRequestException('Failed to parse CSV');
        }
        const mapped = records
            .filter((r) => VALID_DEPARTMENTS.has(r['Department Baru']?.trim()))
            .map((r) => ({
            department: r['Department Baru']?.trim() || undefined,
            team: r['Team Baru']?.trim() || undefined,
            aplikasi: r['Aplikasi']?.trim() || undefined,
            applicationOwner: r['Application Owner']?.trim() || undefined,
            platformOwner: r['Platform Owner']?.trim() || undefined,
            kritikalitas: r['Kritikalis 2025']?.trim() || undefined,
            squadLead: r['Nama SAD/Squad Lead']?.trim() || undefined,
            keterangan: r['Keterangan']?.trim() || undefined,
            support24h: r['Support 24h']?.trim() || undefined,
            target24h: r['Target 24h']?.trim() || undefined,
        }));
        if (mapped.length === 0) {
            throw new common_1.BadRequestException('No valid rows found in CSV');
        }
        return this.service.importRecords(mapped, truncate === 'true');
    }
};
exports.AppMappingController = AppMappingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_app_mapping_dto_1.QueryAppMappingDto]),
    __metadata("design:returntype", void 0)
], AppMappingController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppMappingController.prototype, "getDashboard", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('teams'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppMappingController.prototype, "getTeams", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('departments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppMappingController.prototype, "getDepartments", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('truncate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppMappingController.prototype, "importCsv", null);
exports.AppMappingController = AppMappingController = __decorate([
    (0, common_1.Controller)('app-mapping'),
    __metadata("design:paramtypes", [app_mapping_service_1.AppMappingService])
], AppMappingController);
//# sourceMappingURL=app-mapping.controller.js.map