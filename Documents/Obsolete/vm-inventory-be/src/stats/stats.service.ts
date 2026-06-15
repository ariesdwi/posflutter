import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type BigRow = Record<string, bigint | string | null>;

function toNum(v: bigint | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'bigint') return Number(v);
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeline() {
    const rows = await this.prisma.$queryRaw<BigRow[]>`
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
      year: r.year as string,
      count: toNum(r.count),
      obsoleteCount: toNum(r.obsolete_count),
      criticalCount: toNum(r.critical_count),
      isPast: r.year != null && (r.year as string) <= '2026',
    }));
  }

  async getResources() {
    const rows = await this.prisma.$queryRaw<BigRow[]>`
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

    const overall = rows.reduce(
      (acc, r) => {
        acc.totalVms      += toNum(r.vm_count);
        acc.totalCpus     += toNum(r.total_cpus);
        acc.totalMemoryGb += toNum(r.total_memory_gb);
        acc.totalProvisionedGb += toNum(r.total_provisioned_gb);
        acc.totalUsedGb   += toNum(r.total_used_gb);
        return acc;
      },
      { totalVms: 0, totalCpus: 0, totalMemoryGb: 0, totalProvisionedGb: 0, totalUsedGb: 0 },
    );

    return {
      overall: {
        ...overall,
        utilizationPct:
          overall.totalProvisionedGb > 0
            ? +((overall.totalUsedGb / overall.totalProvisionedGb) * 100).toFixed(2)
            : 0,
      },
      byVcenter: rows.map((r) => ({
        vcenter: r.vcenter as string,
        vmCount: toNum(r.vm_count),
        totalCpus: toNum(r.total_cpus),
        totalNics: toNum(r.total_nics),
        totalMemoryGb: toNum(r.total_memory_gb),
        totalProvisionedGb: toNum(r.total_provisioned_gb),
        totalUsedGb: toNum(r.total_used_gb),
        utilizationPct:
          toNum(r.total_provisioned_gb) > 0
            ? +((toNum(r.total_used_gb) / toNum(r.total_provisioned_gb)) * 100).toFixed(2)
            : 0,
      })),
    };
  }
}
