import { PrismaService } from '../prisma/prisma.service';
export declare class ImportService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    importCsv(buffer: Buffer, options?: {
        truncate?: boolean;
        batchSize?: number;
        filename?: string;
        importedBy?: string;
    }): Promise<{
        total: number;
        inserted: number;
        skipped: number;
        message: string;
    }>;
}
