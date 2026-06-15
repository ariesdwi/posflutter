import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { PartialType } from '@nestjs/mapped-types';

class UpdateAlertRuleDto extends PartialType(CreateAlertRuleDto) {}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.alertRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.alertRule.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({ data: dto });
  }

  update(id: number, dto: UpdateAlertRuleDto) {
    return this.prisma.alertRule.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.alertRule.delete({ where: { id } });
  }

  async triggerWebhooks(payload: object) {
    const rules = await this.prisma.alertRule.findMany({ where: { enabled: true } });
    for (const rule of rules) {
      try {
        await fetch(rule.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule: rule.name, severity: rule.severity, ...payload }),
        });
        this.logger.log(`Webhook fired: ${rule.name} → ${rule.webhookUrl}`);
      } catch (err) {
        this.logger.warn(`Webhook failed: ${rule.name} — ${err.message}`);
      }
    }
  }
}
