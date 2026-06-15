import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(data: {
    entity: string;
    entityId: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    userId?: number;
    username?: string;
    payload?: object;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  findAll(entity?: string) {
    return this.prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
