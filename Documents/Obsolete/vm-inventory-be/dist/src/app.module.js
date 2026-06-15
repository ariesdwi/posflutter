"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const vm_module_1 = require("./vm/vm.module");
const import_module_1 = require("./import/import.module");
const stats_module_1 = require("./stats/stats.module");
const alerts_module_1 = require("./alerts/alerts.module");
const auth_module_1 = require("./auth/auth.module");
const audit_module_1 = require("./audit/audit.module");
const app_mapping_module_1 = require("./app-mapping/app-mapping.module");
const summary_module_1 = require("./summary/summary.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            vm_module_1.VmModule,
            import_module_1.ImportModule,
            stats_module_1.StatsModule,
            alerts_module_1.AlertsModule,
            app_mapping_module_1.AppMappingModule,
            summary_module_1.SummaryModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map