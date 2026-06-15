import { SummaryService, ManagementSummary, ObsoleteSummary, AppDepartmentMapping } from './summary.service';
export declare class SummaryController {
    private readonly summaryService;
    constructor(summaryService: SummaryService);
    getManagementSummary(): Promise<ManagementSummary>;
    getObsoleteSummary(osType: 'Ubuntu' | 'CentOS'): Promise<ObsoleteSummary | {
        error: string;
    }>;
    getAppDepartmentMapping(osType: 'Ubuntu' | 'CentOS', category?: string): Promise<AppDepartmentMapping | {
        error: string;
    }>;
    getSummaryByDepartment(osType?: 'Ubuntu' | 'CentOS'): Promise<{
        department: string;
        totalVMs: number;
        obsoleteVMs: number;
        criticalVMs: number;
        applicationCount: number;
        obsoletePercentage: number;
    }[] | {
        error: string;
    }>;
}
