import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';
export declare class AlertsScheduler {
    private readonly prisma;
    private readonly alertsService;
    private readonly logger;
    constructor(prisma: PrismaService, alertsService: AlertsService);
    dailyCheck(): Promise<void>;
    runNow(): Promise<{
        triggered: boolean;
        timestamp: string;
    }>;
}
