import { StatsService } from './stats.service';
export declare class StatsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    getTimeline(): Promise<{
        year: string;
        count: number;
        obsoleteCount: number;
        criticalCount: number;
        isPast: boolean;
    }[]>;
    getResources(): Promise<{
        overall: {
            utilizationPct: number;
            totalVms: number;
            totalCpus: number;
            totalMemoryGb: number;
            totalProvisionedGb: number;
            totalUsedGb: number;
        };
        byVcenter: {
            vcenter: string;
            vmCount: number;
            totalCpus: number;
            totalNics: number;
            totalMemoryGb: number;
            totalProvisionedGb: number;
            totalUsedGb: number;
            utilizationPct: number;
        }[];
    }>;
}
