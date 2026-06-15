import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';

@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  /** Runs every day at 07:00 */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async dailyCheck() {
    this.logger.log('Running daily VM alert check...');
    const today = new Date().toISOString().split('T')[0];

    // 1. Count expired (endSupportDate < today)
    const expiredCount = await this.prisma.vm.count({
      where: { endSupportDate: { lt: today } },
    });

    // 2. Count OBSOLETE + Critical
    const obsoleteCritical = await this.prisma.vm.count({
      where: { statusOs: 'OBSOLETE', kritikalitas: 'Critical' },
    });

    // 3. Count expiring in next 30 days
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const expiringSoon = await this.prisma.vm.count({
      where: {
        endSupportDate: { gte: today, lte: in30Days.toISOString().split('T')[0] },
      },
    });

    this.logger.log(
      `Alert check: expired=${expiredCount}, obsolete+critical=${obsoleteCritical}, expiring30d=${expiringSoon}`,
    );

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

  /** Manual trigger — available via controller */
  async runNow() {
    await this.dailyCheck();
    return { triggered: true, timestamp: new Date().toISOString() };
  }
}
