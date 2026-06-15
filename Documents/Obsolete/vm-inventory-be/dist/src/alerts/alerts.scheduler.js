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
var AlertsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const alerts_service_1 = require("./alerts.service");
let AlertsScheduler = AlertsScheduler_1 = class AlertsScheduler {
    constructor(prisma, alertsService) {
        this.prisma = prisma;
        this.alertsService = alertsService;
        this.logger = new common_1.Logger(AlertsScheduler_1.name);
    }
    async dailyCheck() {
        this.logger.log('Running daily VM alert check...');
        const today = new Date().toISOString().split('T')[0];
        const expiredCount = await this.prisma.vm.count({
            where: { endSupportDate: { lt: today } },
        });
        const obsoleteCritical = await this.prisma.vm.count({
            where: { statusOs: 'OBSOLETE', kritikalitas: 'Critical' },
        });
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        const expiringSoon = await this.prisma.vm.count({
            where: {
                endSupportDate: { gte: today, lte: in30Days.toISOString().split('T')[0] },
            },
        });
        this.logger.log(`Alert check: expired=${expiredCount}, obsolete+critical=${obsoleteCritical}, expiring30d=${expiringSoon}`);
        if (expiredCount > 0 || obsoleteCritical > 0 || expiringSoon > 0) {
            await this.alertsService.triggerWebhooks({
                timestamp: new Date().toISOString(),
                summary: {
                    expiredVms: expiredCount,
                    obsoleteCriticalVms: obsoleteCritical,
                    expiringSoon30Days: expiringSoon,
                },
            });
        }
    }
    async runNow() {
        await this.dailyCheck();
        return { triggered: true, timestamp: new Date().toISOString() };
    }
};
exports.AlertsScheduler = AlertsScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_7AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlertsScheduler.prototype, "dailyCheck", null);
exports.AlertsScheduler = AlertsScheduler = AlertsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        alerts_service_1.AlertsService])
], AlertsScheduler);
//# sourceMappingURL=alerts.scheduler.js.map