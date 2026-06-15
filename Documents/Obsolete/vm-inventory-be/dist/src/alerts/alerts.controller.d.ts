import { AlertsService } from './alerts.service';
import { AlertsScheduler } from './alerts.scheduler';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
export declare class AlertsController {
    private readonly alertsService;
    private readonly alertsScheduler;
    constructor(alertsService: AlertsService, alertsScheduler: AlertsScheduler);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        webhookUrl: string;
        severity: string;
        enabled: boolean;
    }[]>;
    findOne(id: number): import(".prisma/client").Prisma.Prisma__AlertRuleClient<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        webhookUrl: string;
        severity: string;
        enabled: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    create(dto: CreateAlertRuleDto): import(".prisma/client").Prisma.Prisma__AlertRuleClient<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        webhookUrl: string;
        severity: string;
        enabled: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: number, dto: CreateAlertRuleDto): import(".prisma/client").Prisma.Prisma__AlertRuleClient<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        webhookUrl: string;
        severity: string;
        enabled: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: number): import(".prisma/client").Prisma.Prisma__AlertRuleClient<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        webhookUrl: string;
        severity: string;
        enabled: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    triggerNow(): Promise<{
        triggered: boolean;
        timestamp: string;
    }>;
}
