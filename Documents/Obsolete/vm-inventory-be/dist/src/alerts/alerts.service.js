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
var AlertsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const create_alert_rule_dto_1 = require("./dto/create-alert-rule.dto");
const mapped_types_1 = require("@nestjs/mapped-types");
class UpdateAlertRuleDto extends (0, mapped_types_1.PartialType)(create_alert_rule_dto_1.CreateAlertRuleDto) {
}
let AlertsService = AlertsService_1 = class AlertsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AlertsService_1.name);
    }
    findAll() {
        return this.prisma.alertRule.findMany({ orderBy: { createdAt: 'desc' } });
    }
    findOne(id) {
        return this.prisma.alertRule.findUniqueOrThrow({ where: { id } });
    }
    create(dto) {
        return this.prisma.alertRule.create({ data: dto });
    }
    update(id, dto) {
        return this.prisma.alertRule.update({ where: { id }, data: dto });
    }
    remove(id) {
        return this.prisma.alertRule.delete({ where: { id } });
    }
    async triggerWebhooks(payload) {
        const rules = await this.prisma.alertRule.findMany({ where: { enabled: true } });
        for (const rule of rules) {
            try {
                await fetch(rule.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rule: rule.name, severity: rule.severity, ...payload }),
                });
                this.logger.log(`Webhook fired: ${rule.name} → ${rule.webhookUrl}`);
            }
            catch (err) {
                this.logger.warn(`Webhook failed: ${rule.name} — ${err.message}`);
            }
        }
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = AlertsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map