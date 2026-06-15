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
exports.SummaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function toNum(v) {
    if (v == null)
        return 0;
    if (typeof v === 'bigint')
        return Number(v);
    const n = parseFloat(String(v));
    return isNaN(n) ? 0 : n;
}
let SummaryService = class SummaryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getManagementSummary() {
        const [ubuntuObsolete, centosObsolete, ubuntuAppMapping, centosAppMapping] = await Promise.all([
            this.getObsoleteSummary('Ubuntu'),
            this.getObsoleteSummary('CentOS'),
            this.getAppDepartmentMapping('Ubuntu', 'Production'),
            this.getAppDepartmentMapping('CentOS', 'Production'),
        ]);
        return {
            generatedAt: new Date(),
            overview: {
                totalObsoleteUbuntu: ubuntuObsolete.totalObsolete,
                totalObsoleteCentOS: centosObsolete.totalObsolete,
                totalProductionVMs: ubuntuObsolete.totalProduction + centosObsolete.totalProduction,
                criticalObsolete: ubuntuObsolete.byKritikalitas.find((k) => k.kritikalitas === 'Critical')?.count || 0 +
                    centosObsolete.byKritikalitas.find((k) => k.kritikalitas === 'Critical')?.count || 0,
            },
            ubuntuObsolete,
            centosObsolete,
            ubuntuAppMapping,
            centosAppMapping,
        };
    }
    async getObsoleteSummary(osType) {
        const osPattern = osType === 'Ubuntu' ? '%Ubuntu%' : '%CentOS%';
        const totalObsolete = await this.prisma.vm.count({
            where: {
                statusOs: 'OBSOLETE',
                category: 'Production',
                guestOs: {
                    contains: osType,
                    mode: 'insensitive',
                },
            },
        });
        const totalProduction = await this.prisma.vm.count({
            where: {
                category: 'Production',
                guestOs: {
                    contains: osType,
                    mode: 'insensitive',
                },
            },
        });
        const byKritikalitasRows = await this.prisma.$queryRaw `
      SELECT
        COALESCE("kritikalitas", 'Unspecified') AS kritikalitas,
        COUNT(*) AS count
      FROM vms
      WHERE "statusOs" = 'OBSOLETE'
        AND category = 'Production'
        AND "guestOs" ILIKE ${osPattern}
      GROUP BY "kritikalitas"
      ORDER BY count DESC
    `;
        const byKritikalitas = byKritikalitasRows.map((r) => ({
            kritikalitas: r.kritikalitas,
            count: toNum(r.count),
        }));
        const byClusterRows = await this.prisma.$queryRaw `
      SELECT
        COALESCE(cluster, 'Unknown') AS cluster,
        COUNT(*) AS count,
        ARRAY_AGG(DISTINCT application) FILTER (WHERE application IS NOT NULL) AS applications
      FROM vms
      WHERE "statusOs" = 'OBSOLETE'
        AND category = 'Production'
        AND "guestOs" ILIKE ${osPattern}
      GROUP BY cluster
      ORDER BY count DESC
      LIMIT 10
    `;
        const byCluster = byClusterRows.map((r) => ({
            cluster: r.cluster,
            count: toNum(r.count),
            applications: Array.isArray(r.applications) ? r.applications : [],
        }));
        const endingSoonRows = await this.prisma.$queryRaw `
      SELECT
        SUBSTRING("endSupportDate", 1, 4) AS year,
        COUNT(*) AS count
      FROM vms
      WHERE "statusOs" = 'OBSOLETE'
        AND category = 'Production'
        AND "guestOs" ILIKE ${osPattern}
        AND "endSupportDate" IS NOT NULL
        AND "endSupportDate" <> ''
      GROUP BY year
      ORDER BY year
    `;
        const endingSoon = endingSoonRows.map((r) => ({
            year: r.year,
            count: toNum(r.count),
        }));
        return {
            osType,
            totalObsolete,
            totalProduction,
            obsoletePercentage: totalProduction > 0 ? +(totalObsolete / totalProduction * 100).toFixed(2) : 0,
            byKritikalitas,
            byCluster,
            endingSoon,
        };
    }
    async getAppDepartmentMapping(osType, category = 'Production') {
        const osPattern = osType === 'Ubuntu' ? '%Ubuntu%' : '%CentOS%';
        const vms = await this.prisma.vm.findMany({
            where: {
                category,
                guestOs: {
                    contains: osType,
                    mode: 'insensitive',
                },
                application: {
                    not: null,
                },
            },
            select: {
                namaList: true,
                cluster: true,
                ipAddress: true,
                guestOs: true,
                application: true,
                kritikalitas: true,
            },
        });
        const appMappings = await this.prisma.appMapping.findMany({
            select: {
                aplikasi: true,
                department: true,
                team: true,
                kritikalitas: true,
                applicationOwner: true,
                support24h: true,
            },
        });
        const appMappingLookup = new Map(appMappings.map((am) => [am.aplikasi?.toLowerCase().trim(), am]));
        const departmentMap = new Map();
        for (const vm of vms) {
            const appName = vm.application?.trim() || 'Unknown';
            const appKey = appName.toLowerCase();
            const mapping = appMappingLookup.get(appKey);
            const dept = mapping?.department || 'Unknown Department';
            const team = mapping?.team || null;
            if (!departmentMap.has(dept)) {
                departmentMap.set(dept, {
                    department: dept,
                    team,
                    vmCount: 0,
                    apps: new Map(),
                });
            }
            const deptData = departmentMap.get(dept);
            deptData.vmCount++;
            if (!deptData.apps.has(appName)) {
                deptData.apps.set(appName, {
                    name: appName,
                    vmCount: 0,
                    kritikalitas: mapping?.kritikalitas || vm.kritikalitas || 'Unknown',
                    owner: mapping?.applicationOwner || 'Unknown',
                    support24h: mapping?.support24h || 'Unknown',
                    vms: [],
                });
            }
            const appData = deptData.apps.get(appName);
            appData.vmCount++;
            appData.vms.push({
                namaList: vm.namaList || '',
                cluster: vm.cluster || '',
                ipAddress: vm.ipAddress || '',
                guestOs: vm.guestOs || '',
            });
        }
        const departments = Array.from(departmentMap.values())
            .map((dept) => ({
            department: dept.department,
            team: dept.team,
            vmCount: dept.vmCount,
            applications: Array.from(dept.apps.values()).sort((a, b) => b.vmCount - a.vmCount),
        }))
            .sort((a, b) => b.vmCount - a.vmCount);
        return {
            osType,
            category,
            totalVMs: vms.length,
            departments,
        };
    }
    async getSummaryByDepartment(osType) {
        const whereClause = {
            category: 'Production',
            application: {
                not: null,
            },
        };
        if (osType) {
            whereClause.guestOs = {
                contains: osType,
                mode: 'insensitive',
            };
        }
        const vms = await this.prisma.vm.findMany({
            where: whereClause,
            select: {
                application: true,
                statusOs: true,
                kritikalitas: true,
            },
        });
        const appMappings = await this.prisma.appMapping.findMany();
        const appMappingLookup = new Map(appMappings.map((am) => [am.aplikasi?.toLowerCase().trim(), am]));
        const deptSummary = new Map();
        for (const vm of vms) {
            const appName = vm.application?.trim() || 'Unknown';
            const mapping = appMappingLookup.get(appName.toLowerCase());
            const dept = mapping?.department || 'Unknown Department';
            if (!deptSummary.has(dept)) {
                deptSummary.set(dept, {
                    department: dept,
                    totalVMs: 0,
                    obsoleteVMs: 0,
                    criticalVMs: 0,
                    applications: new Set(),
                });
            }
            const summary = deptSummary.get(dept);
            summary.totalVMs++;
            if (vm.statusOs === 'OBSOLETE') {
                summary.obsoleteVMs++;
            }
            if (vm.kritikalitas === 'Critical') {
                summary.criticalVMs++;
            }
            summary.applications.add(appName);
        }
        return Array.from(deptSummary.values())
            .map((s) => ({
            department: s.department,
            totalVMs: s.totalVMs,
            obsoleteVMs: s.obsoleteVMs,
            criticalVMs: s.criticalVMs,
            applicationCount: s.applications.size,
            obsoletePercentage: s.totalVMs > 0 ? +((s.obsoleteVMs / s.totalVMs) * 100).toFixed(2) : 0,
        }))
            .sort((a, b) => b.totalVMs - a.totalVMs);
    }
};
exports.SummaryService = SummaryService;
exports.SummaryService = SummaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SummaryService);
//# sourceMappingURL=summary.service.js.map