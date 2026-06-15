import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(data: {
        entity: string;
        entityId: number;
        action: 'CREATE' | 'UPDATE' | 'DELETE';
        userId?: number;
        username?: string;
        payload?: object;
    }): import(".prisma/client").Prisma.Prisma__AuditLogClient<{
        id: number;
        username: string | null;
        createdAt: Date;
        entity: string;
        entityId: number;
        action: string;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        userId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
