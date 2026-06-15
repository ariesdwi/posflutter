import { PrismaService } from '../prisma/prisma.service';
import { QueryAppMappingDto } from './dto/query-app-mapping.dto';
export declare class AppMappingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: QueryAppMappingDto): Promise<{
        data: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            kritikalitas: string | null;
            keterangan: string | null;
            team: string | null;
            department: string | null;
            aplikasi: string | null;
            applicationOwner: string | null;
            platformOwner: string | null;
            squadLead: string | null;
            support24h: string | null;
            target24h: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getDashboard(): Promise<{
        totalApps: number;
        byTeam: {
            team: string;
            count: number;
        }[];
        byDepartment: {
            department: string;
            count: number;
        }[];
        byKritikalitas: {
            kritikalitas: string;
            count: number;
        }[];
    }>;
    getTeams(): Promise<{
        team: string;
        count: number;
    }[]>;
    getDepartments(): Promise<{
        department: string;
        count: number;
    }[]>;
    importRecords(records: Array<{
        department?: string;
        team?: string;
        aplikasi?: string;
        applicationOwner?: string;
        platformOwner?: string;
        kritikalitas?: string;
        squadLead?: string;
        keterangan?: string;
        support24h?: string;
        target24h?: string;
    }>, truncate?: boolean): Promise<{
        inserted: number;
    }>;
}
