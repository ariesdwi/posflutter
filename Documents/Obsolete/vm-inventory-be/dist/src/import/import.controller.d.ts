import { ImportService } from './import.service';
export declare class ImportController {
    private readonly importService;
    constructor(importService: ImportService);
    importCsv(file: Express.Multer.File, truncate?: string, batchSize?: string, req?: any): Promise<{
        total: number;
        inserted: number;
        skipped: number;
        message: string;
    }>;
}
