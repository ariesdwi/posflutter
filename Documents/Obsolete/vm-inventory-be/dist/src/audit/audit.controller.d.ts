import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(entity?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: number;
        username: string | null;
        createdAt: Date;
        entity: string;
        entityId: number;
        action: string;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        userId: number | null;
    }[]>;
}
