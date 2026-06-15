import { AppMappingService } from './app-mapping.service';
import { QueryAppMappingDto } from './dto/query-app-mapping.dto';
export declare class AppMappingController {
    private readonly service;
    constructor(service: AppMappingService);
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
    importCsv(file: Express.Multer.File, truncate?: string): Promise<{
        inserted: number;
    }>;
}
