import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { Prisma } from '@prisma/client';

const CSV_COLUMN_MAP: Record<string, string> = {
  'No.': 'no',
  'nama_list': 'namaList',
  'kondisi': 'kondisi',
  'cluster': 'cluster',
  'host': 'host',
  'compatibility': 'compatibility',
  'guest_os': 'guestOs',
  'provisioned_space': 'provisionedSpace',
  'used_space': 'usedSpace',
  'memory_size': 'memorySize',
  'cpus': 'cpus',
  'nics': 'nics',
  'ip_address': 'ipAddress',
  'uuid': 'uuid',
  'uptime': 'uptime',
  'datastore': 'datastore',
  'application': 'application',
  'component': 'component',
  'kritikalitas': 'kritikalitas',
  'category': 'category',
  'notes': 'notes',
  'os_detail': 'osDetail',
  'ip_detail': 'ipDetail',
  'ma_owner': 'maOwner',
  'ma_ops': 'maOps',
  'ma_dev': 'maDev',
  'vcenter': 'vcenter',
  'end_support_date': 'endSupportDate',
  'STATUS_OS': 'statusOs',
  'detail_status': 'detailStatus',
  'keterangan': 'keterangan',
};

const INT_FIELDS = new Set(['no', 'cpus', 'nics']);

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importCsv(
    buffer: Buffer,
    options: { truncate?: boolean; batchSize?: number; filename?: string; importedBy?: string } = {},
  ) {
    const { truncate = false, batchSize = 500, filename = 'unknown.csv', importedBy } = options;

    let records: Record<string, string>[];
    try {
      records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        bom: true,
      });
    } catch (err) {
      throw new BadRequestException(`CSV parse error: ${err.message}`);
    }

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    if (truncate) {
      await this.prisma.vm.deleteMany();
      this.logger.log('Table truncated before import');
    }

    const rows: Prisma.VmCreateManyInput[] = records.map((record) => {
      const row: Record<string, any> = {};
      for (const [csvKey, fieldKey] of Object.entries(CSV_COLUMN_MAP)) {
        const rawValue = record[csvKey]?.trim() ?? record[csvKey.trim()]?.trim() ?? '';
        if (rawValue === '') {
          row[fieldKey] = null;
        } else if (INT_FIELDS.has(fieldKey)) {
          const parsed = parseInt(rawValue.replace(/,/g, ''), 10);
          row[fieldKey] = isNaN(parsed) ? null : parsed;
        } else {
          row[fieldKey] = rawValue;
        }
      }
      return row as Prisma.VmCreateManyInput;
    });

    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const result = await this.prisma.vm.createMany({
        data: batch,
        skipDuplicates: false,
      });
      inserted += result.count;
      this.logger.log(
        `Batch ${Math.floor(i / batchSize) + 1}: inserted ${result.count} rows`,
      );
    }

    // Log to ImportHistory (non-critical — swallow errors)
    await this.prisma.importHistory.create({
      data: {
        filename,
        total: records.length,
        inserted,
        truncated: truncate,
        importedBy: importedBy ?? null,
      },
    }).catch(() => undefined);

    return {
      total: records.length,
      inserted,
      skipped,
      message: `Import completed. ${inserted} of ${records.length} rows inserted.`,
    };
  }
}
