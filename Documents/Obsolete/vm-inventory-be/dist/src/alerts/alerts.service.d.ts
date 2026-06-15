import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
declare const UpdateAlertRuleDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAlertRuleDto>>;
declare class UpdateAlertRuleDto extends UpdateAlertRuleDto_base {
}
export declare class AlertsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
    update(id: number, dto: UpdateAlertRuleDto): import(".prisma/client").Prisma.Prisma__AlertRuleClient<{
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
    triggerWebhooks(payload: object): Promise<void>;
}
export {};
