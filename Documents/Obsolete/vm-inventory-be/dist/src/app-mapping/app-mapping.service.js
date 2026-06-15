"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppMappingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AppMappingService = class AppMappingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { page = 1, limit = 20, search, department, team, kritikalitas } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { aplikasi: { contains: search, mode: 'insensitive' } },
                { squadLead: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
                { team: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (department)
            where.department = { contains: department, mode: 'insensitive' };
        if (team)
            where.team = { contains: team, mode: 'insensitive' };
        if (kritikalitas)
            where.kritikalitas = { contains: kritikalitas, mode: 'insensitive' };
        const [total, data] = await this.prisma.$transaction([
            this.prisma.appMapping.count({ where }),
            this.prisma.appMapping.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ department: 'asc' }, { team: 'asc' }, { aplikasi: 'asc' }],
            }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getDashboard() {
        const [totalApps, byTeam, byDepartment, byKritikalitas,] = await this.prisma.$transaction([
            this.prisma.appMapping.count(),
            this.prisma.$queryRaw `
        SELECT team, COUNT(*) AS count
        FROM app_mappings
        WHERE team IS NOT NULL AND team <> ''
        GROUP BY team
        ORDER BY count DESC
      `,
            this.prisma.$queryRaw `
        SELECT department, COUNT(*) AS count
        FROM app_mappings
        WHERE department IS NOT NULL AND department <> ''
        GROUP BY department
        ORDER BY count DESC
      `,
            this.prisma.$queryRaw `
        SELECT COALESCE(kritikalitas, '#N/A') AS kritikalitas, COUNT(*) AS count
        FROM app_mappings
        GROUP BY kritikalitas
        ORDER BY count DESC
      `,
        ]);
        return {
            totalApps,
            byTeam: byTeam.map((r) => ({
                team: r.team,
                count: Number(r.count),
            })),
            byDepartment: byDepartment.map((r) => ({
                department: r.department,
                count: Number(r.count),
            })),
            byKritikalitas: byKritikalitas.map((r) => ({
                kritikalitas: r.kritikalitas,
                count: Number(r.count),
            })),
        };
    }
    async getTeams() {
        const rows = await this.prisma.$queryRaw `
      SELECT team, COUNT(*) AS count
      FROM app_mappings
      WHERE team IS NOT NULL AND team <> ''
      GROUP BY team
      ORDER BY team ASC
    `;
        return rows.map((r) => ({
            team: r.team,
            count: Number(r.count),
        }));
    }
    async getDepartments() {
        const rows = await this.prisma.$queryRaw `
      SELECT department, COUNT(*) AS count
      FROM app_mappings
      WHERE department IS NOT NULL AND department <> ''
      GROUP BY department
      ORDER BY department ASC
    `;
        return rows.map((r) => ({
            department: r.department,
            count: Number(r.count),
        }));
    }
    async importRecords(records, truncate = false) {
        return this.prisma.$transaction(async (tx) => {
            if (truncate) {
                await tx.$executeRaw `TRUNCATE TABLE app_mappings RESTART IDENTITY`;
            }
            const data = records.map((r) => ({
                department: r.department || null,
                team: r.team || null,
                aplikasi: r.aplikasi || null,
                applicationOwner: r.applicationOwner || null,
                platformOwner: r.platformOwner || null,
                kritikalitas: r.kritikalitas || null,
                squadLead: r.squadLead || null,
                keterangan: r.keterangan || null,
                support24h: r.support24h || null,
                target24h: r.target24h || null,
            }));
            await tx.appMapping.createMany({ data });
            return { inserted: data.length };
        });
    }
};
exports.AppMappingService = AppMappingService;
exports.AppMappingService = AppMappingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppMappingService);
//# sourceMappingURL=app-mapping.service.js.map