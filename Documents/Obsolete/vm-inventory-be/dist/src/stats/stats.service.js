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
exports.StatsService = void 0;
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
let StatsService = class StatsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTimeline() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        SUBSTRING("endSupportDate", 1, 4)                                    AS year,
        COUNT(*)                                                              AS count,
        COUNT(CASE WHEN "statusOs" = 'OBSOLETE'       THEN 1 END)            AS obsolete_count,
        COUNT(CASE WHEN "kritikalitas" = 'Critical'   THEN 1 END)            AS critical_count
      FROM vms
      WHERE "endSupportDate" IS NOT NULL AND "endSupportDate" <> ''
      GROUP BY year
      ORDER BY year
    `;
        return rows.map((r) => ({
            year: r.year,
            count: toNum(r.count),
            obsoleteCount: toNum(r.obsolete_count),
            criticalCount: toNum(r.critical_count),
            isPast: r.year != null && r.year <= '2026',
        }));
    }
    async getResources() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        COALESCE(vcenter, 'Unknown')                              AS vcenter,
        COUNT(*)                                                  AS vm_count,
        COALESCE(SUM(cpus), 0)                                   AS total_cpus,
        COALESCE(SUM(nics), 0)                                   AS total_nics,
        COALESCE(SUM(
          CAST(NULLIF(
            REGEXP_REPLACE("memorySize", '[^0-9]', '', 'g'), ''
          ) AS NUMERIC)
        ), 0)                                                     AS total_memory_gb,
        COALESCE(SUM(
          CAST(NULLIF(
            REPLACE(REGEXP_REPLACE("provisionedSpace", '[^0-9,.]', '', 'g'), ',', ''), ''
          ) AS NUMERIC)
        ), 0)                                                     AS total_provisioned_gb,
        COALESCE(SUM(
          CAST(NULLIF(
            REPLACE(REGEXP_REPLACE("usedSpace", '[^0-9,.]', '', 'g'), ',', ''), ''
          ) AS NUMERIC)
        ), 0)                                                     AS total_used_gb
      FROM vms
      GROUP BY vcenter
      ORDER BY vm_count DESC
    `;
        const overall = rows.reduce((acc, r) => {
            acc.totalVms += toNum(r.vm_count);
            acc.totalCpus += toNum(r.total_cpus);
            acc.totalMemoryGb += toNum(r.total_memory_gb);
            acc.totalProvisionedGb += toNum(r.total_provisioned_gb);
            acc.totalUsedGb += toNum(r.total_used_gb);
            return acc;
        }, { totalVms: 0, totalCpus: 0, totalMemoryGb: 0, totalProvisionedGb: 0, totalUsedGb: 0 });
        return {
            overall: {
                ...overall,
                utilizationPct: overall.totalProvisionedGb > 0
                    ? +((overall.totalUsedGb / overall.totalProvisionedGb) * 100).toFixed(2)
                    : 0,
            },
            byVcenter: rows.map((r) => ({
                vcenter: r.vcenter,
                vmCount: toNum(r.vm_count),
                totalCpus: toNum(r.total_cpus),
                totalNics: toNum(r.total_nics),
                totalMemoryGb: toNum(r.total_memory_gb),
                totalProvisionedGb: toNum(r.total_provisioned_gb),
                totalUsedGb: toNum(r.total_used_gb),
                utilizationPct: toNum(r.total_provisioned_gb) > 0
                    ? +((toNum(r.total_used_gb) / toNum(r.total_provisioned_gb)) * 100).toFixed(2)
                    : 0,
            })),
        };
    }
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatsService);
//# sourceMappingURL=stats.service.js.map