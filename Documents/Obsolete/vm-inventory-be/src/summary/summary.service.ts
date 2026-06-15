import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type BigRow = Record<string, bigint | string | null>;

function toNum(v: bigint | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'bigint') return Number(v);
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

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

@Injectable()
export class SummaryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate comprehensive management summary report
   */
  async getManagementSummary(): Promise<ManagementSummary> {
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
        criticalObsolete:
          ubuntuObsolete.byKritikalitas.find((k) => k.kritikalitas === 'Critical')?.count || 0 +
          centosObsolete.byKritikalitas.find((k) => k.kritikalitas === 'Critical')?.count || 0,
      },
      ubuntuObsolete,
      centosObsolete,
      ubuntuAppMapping,
      centosAppMapping,
    };
  }

  /**
   * Get obsolete VM summary for specific OS type (Ubuntu or CentOS) in Production
   */
  async getObsoleteSummary(osType: 'Ubuntu' | 'CentOS'): Promise<ObsoleteSummary> {
    const osPattern = osType === 'Ubuntu' ? '%Ubuntu%' : '%CentOS%';

    // Total obsolete count
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

    // Total production count for this OS
    const totalProduction = await this.prisma.vm.count({
      where: {
        category: 'Production',
        guestOs: {
          contains: osType,
          mode: 'insensitive',
        },
      },
    });

    // By kritikalitas
    const byKritikalitasRows = await this.prisma.$queryRaw<BigRow[]>`
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
      kritikalitas: r.kritikalitas as string,
      count: toNum(r.count),
    }));

    // By cluster with applications
    const byClusterRows = await this.prisma.$queryRaw<BigRow[]>`
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
      cluster: r.cluster as string,
      count: toNum(r.count),
      applications: Array.isArray(r.applications) ? (r.applications as string[]) : [],
    }));

    // End support date timeline
    const endingSoonRows = await this.prisma.$queryRaw<BigRow[]>`
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
      year: r.year as string,
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

  /**
   * Get application-department mapping for specific OS and category
   */
  async getAppDepartmentMapping(
    osType: 'Ubuntu' | 'CentOS',
    category: string = 'Production',
  ): Promise<AppDepartmentMapping> {
    const osPattern = osType === 'Ubuntu' ? '%Ubuntu%' : '%CentOS%';

    // Get all VMs with their applications
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

    // Get all app mappings
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

    // Create a mapping lookup
    const appMappingLookup = new Map(
      appMappings.map((am) => [am.aplikasi?.toLowerCase().trim(), am]),
    );

    // Group VMs by department
    const departmentMap = new Map<
      string,
      {
        department: string;
        team: string | null;
        vmCount: number;
        apps: Map<
          string,
          {
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
          }
        >;
      }
    >();

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

      const deptData = departmentMap.get(dept)!;
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

      const appData = deptData.apps.get(appName)!;
      appData.vmCount++;
      appData.vms.push({
        namaList: vm.namaList || '',
        cluster: vm.cluster || '',
        ipAddress: vm.ipAddress || '',
        guestOs: vm.guestOs || '',
      });
    }

    // Convert to array format
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

  /**
   * Get summary by department for specific OS type
   */
  async getSummaryByDepartment(osType?: 'Ubuntu' | 'CentOS') {
    const whereClause: any = {
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
    const appMappingLookup = new Map(
      appMappings.map((am) => [am.aplikasi?.toLowerCase().trim(), am]),
    );

    const deptSummary = new Map<
      string,
      {
        department: string;
        totalVMs: number;
        obsoleteVMs: number;
        criticalVMs: number;
        applications: Set<string>;
      }
    >();

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

      const summary = deptSummary.get(dept)!;
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
}
