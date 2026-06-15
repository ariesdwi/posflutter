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
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sync_1 = require("csv-parse/sync");
const CSV_COLUMN_MAP = {
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
let ImportService = ImportService_1 = class ImportService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ImportService_1.name);
    }
    async importCsv(buffer, options = {}) {
        const { truncate = false, batchSize = 500, filename = 'unknown.csv', importedBy } = options;
        let records;
        try {
            records = (0, sync_1.parse)(buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
                bom: true,
            });
        }
        catch (err) {
            throw new common_1.BadRequestException(`CSV parse error: ${err.message}`);
        }
        if (records.length === 0) {
            throw new common_1.BadRequestException('CSV file is empty or has no data rows');
        }
        if (truncate) {
            await this.prisma.vm.deleteMany();
            this.logger.log('Table truncated before import');
        }
        const rows = records.map((record) => {
            const row = {};
            for (const [csvKey, fieldKey] of Object.entries(CSV_COLUMN_MAP)) {
                const rawValue = record[csvKey]?.trim() ?? record[csvKey.trim()]?.trim() ?? '';
                if (rawValue === '') {
                    row[fieldKey] = null;
                }
                else if (INT_FIELDS.has(fieldKey)) {
                    const parsed = parseInt(rawValue.replace(/,/g, ''), 10);
                    row[fieldKey] = isNaN(parsed) ? null : parsed;
                }
                else {
                    row[fieldKey] = rawValue;
                }
            }
            return row;
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
            this.logger.log(`Batch ${Math.floor(i / batchSize) + 1}: inserted ${result.count} rows`);
        }
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
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportService);
//# sourceMappingURL=import.service.js.map