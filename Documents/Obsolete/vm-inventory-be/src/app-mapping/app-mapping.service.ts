import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAppMappingDto } from './dto/query-app-mapping.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppMappingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAppMappingDto) {
    const { page = 1, limit = 20, search, department, team, kritikalitas } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppMappingWhereInput = {};

    if (search) {
      where.OR = [
        { aplikasi: { contains: search, mode: 'insensitive' } },
        { squadLead: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { team: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (team) where.team = { contains: team, mode: 'insensitive' };
    if (kritikalitas) where.kritikalitas = { contains: kritikalitas, mode: 'insensitive' };

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
    const [
      totalApps,
      byTeam,
      byDepartment,
      byKritikalitas,
    ] = await this.prisma.$transaction([
      this.prisma.appMapping.count(),

      this.prisma.$queryRaw<Array<{ team: string | null; count: bigint }>>`
        SELECT team, COUNT(*) AS count
        FROM app_mappings
        WHERE team IS NOT NULL AND team <> ''
        GROUP BY team
        ORDER BY count DESC
      `,

      this.prisma.$queryRaw<Array<{ department: string | null; count: bigint }>>`
        SELECT department, COUNT(*) AS count
        FROM app_mappings
        WHERE department IS NOT NULL AND department <> ''
        GROUP BY department
        ORDER BY count DESC
      `,

      this.prisma.$queryRaw<Array<{ kritikalitas: string | null; count: bigint }>>`
        SELECT COALESCE(kritikalitas, '#N/A') AS kritikalitas, COUNT(*) AS count
        FROM app_mappings
        GROUP BY kritikalitas
        ORDER BY count DESC
      `,
    ]);

    return {
      totalApps,
      byTeam: (byTeam as Array<{ team: string | null; count: bigint }>).map((r) => ({
        team: r.team,
        count: Number(r.count),
      })),
      byDepartment: (byDepartment as Array<{ department: string | null; count: bigint }>).map((r) => ({
        department: r.department,
        count: Number(r.count),
      })),
      byKritikalitas: (byKritikalitas as Array<{ kritikalitas: string | null; count: bigint }>).map((r) => ({
        kritikalitas: r.kritikalitas,
        count: Number(r.count),
      })),
    };
  }

  async getTeams() {
    const rows = await this.prisma.$queryRaw<Array<{ team: string | null; count: bigint }>>`
      SELECT team, COUNT(*) AS count
      FROM app_mappings
      WHERE team IS NOT NULL AND team <> ''
      GROUP BY team
      ORDER BY team ASC
    `;
    return (rows as Array<{ team: string | null; count: bigint }>).map((r) => ({
      team: r.team,
      count: Number(r.count),
    }));
  }

  async getDepartments() {
    const rows = await this.prisma.$queryRaw<Array<{ department: string | null; count: bigint }>>`
      SELECT department, COUNT(*) AS count
      FROM app_mappings
      WHERE department IS NOT NULL AND department <> ''
      GROUP BY department
      ORDER BY department ASC
    `;
    return (rows as Array<{ department: string | null; count: bigint }>).map((r) => ({
      department: r.department,
      count: Number(r.count),
    }));
  }

  async importRecords(
    records: Array<{
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
    }>,
    truncate = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (truncate) {
        await tx.$executeRaw`TRUNCATE TABLE app_mappings RESTART IDENTITY`;
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
}
