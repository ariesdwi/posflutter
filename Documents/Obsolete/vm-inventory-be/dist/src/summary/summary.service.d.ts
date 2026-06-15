import { PrismaService } from '../prisma/prisma.service';
export interface ObsoleteSummary {
    osType: string;
    totalObsolete: number;
    totalProduction: number;
    obsoletePercentage: number;
    byKritikalitas: Array<{
        kritikalitas: string;
        count: number;
    }>;
    byCluster: Array<{
        cluster: string;
        count: number;
        applications: string[];
    }>;
    endingSoon: Array<{
        year: string;
        count: number;
    }>;
}
export interface AppDepartmentMapping {
    osType: string;
    category: string;
    totalVMs: number;
    departments: Array<{
        department: string;
        team: string | null;
        vmCount: number;
        applications: Array<{
            name: string;
            vmCount: number;
            kritikalitas: string;
            owner: string;
            support24h: string;
            vms: Array<{
                namaList: string;
                cluster: string;
                ipAddress: string;
                guestOs: string;
            }>;
        }>;
    }>;
}
export interface ManagementSummary {
    generatedAt: Date;
    overview: {
        totalObsoleteUbuntu: number;
        totalObsoleteCentOS: number;
        totalProductionVMs: number;
        criticalObsolete: number;
    };
    ubuntuObsolete: ObsoleteSummary;
    centosObsolete: ObsoleteSummary;
    ubuntuAppMapping: AppDepartmentMapping;
    centosAppMapping: AppDepartmentMapping;
}
export declare class SummaryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getManagementSummary(): Promise<ManagementSummary>;
    getObsoleteSummary(osType: 'Ubuntu' | 'CentOS'): Promise<ObsoleteSummary>;
    getAppDepartmentMapping(osType: 'Ubuntu' | 'CentOS', category?: string): Promise<AppDepartmentMapping>;
    getSummaryByDepartment(osType?: 'Ubuntu' | 'CentOS'): Promise<{
        department: string;
        totalVMs: number;
        obsoleteVMs: number;
        criticalVMs: number;
        applicationCount: number;
        obsoletePercentage: number;
    }[]>;
}
