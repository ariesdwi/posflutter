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
exports.VmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let VmService = class VmService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(query) {
        const { page = 1, limit = 20, search, cluster, kondisi, statusOs, kritikalitas, vcenter, category, application, osDetail, team, department, } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { namaList: { contains: search, mode: 'insensitive' } },
                { application: { contains: search, mode: 'insensitive' } },
                { ipAddress: { contains: search, mode: 'insensitive' } },
                { uuid: { contains: search, mode: 'insensitive' } },
                { host: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (cluster)
            where.cluster = { contains: cluster, mode: 'insensitive' };
        if (kondisi)
            where.kondisi = { contains: kondisi, mode: 'insensitive' };
        if (statusOs)
            where.statusOs = { contains: statusOs, mode: 'insensitive' };
        if (kritikalitas)
            where.kritikalitas = { contains: kritikalitas, mode: 'insensitive' };
        if (vcenter)
            where.vcenter = { contains: vcenter, mode: 'insensitive' };
        if (category)
            where.category = { contains: category, mode: 'insensitive' };
        if (osDetail)
            where.osDetail = { contains: osDetail, mode: 'insensitive' };
        const normalizedDepartment = department?.trim();
        const isUnknownDepartment = normalizedDepartment?.toLowerCase() === 'unknown department';
        if (team || normalizedDepartment) {
            if (isUnknownDepartment) {
                const knownDeptMappings = await this.prisma.appMapping.findMany({
                    where: {
                        ...(team ? { team: { contains: team, mode: 'insensitive' } } : {}),
                        NOT: [{ department: null }, { department: '' }],
                    },
                    select: { aplikasi: true },
                });
                const knownAppNames = knownDeptMappings
                    .map((m) => m.aplikasi)
                    .filter(Boolean);
                const unknownApplicationFilter = {
                    OR: [
                        { application: null },
                        { application: { notIn: knownAppNames, mode: 'insensitive' } },
                    ],
                };
                if (application) {
                    where.AND = [
                        { application: { contains: application, mode: 'insensitive' } },
                        unknownApplicationFilter,
                    ];
                }
                else {
                    Object.assign(where, unknownApplicationFilter);
                }
            }
            else {
                const appFilter = {};
                if (team)
                    appFilter.team = { contains: team, mode: 'insensitive' };
                if (normalizedDepartment)
                    appFilter.department = {
                        contains: normalizedDepartment,
                        mode: 'insensitive',
                    };
                const mappings = await this.prisma.appMapping.findMany({
                    where: appFilter,
                    select: { aplikasi: true },
                });
                const appNames = mappings.map((m) => m.aplikasi).filter(Boolean);
                if (application) {
                    where.AND = [
                        { application: { contains: application, mode: 'insensitive' } },
                        { application: { in: appNames, mode: 'insensitive' } },
                    ];
                }
                else {
                    where.application = { in: appNames, mode: 'insensitive' };
                }
            }
        }
        else if (application) {
            where.application = { contains: application, mode: 'insensitive' };
        }
        const [total, data] = await this.prisma.$transaction([
            this.prisma.vm.count({ where }),
            this.prisma.vm.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: 'asc' },
            }),
        ]);
        const appNames = data
            .map((v) => v.application)
            .filter(Boolean);
        const mappings = appNames.length
            ? await this.prisma.appMapping.findMany({
                where: { aplikasi: { in: appNames, mode: 'insensitive' } },
                select: {
                    aplikasi: true,
                    team: true,
                    department: true,
                    squadLead: true,
                    kritikalitas: true,
                    applicationOwner: true,
                    platformOwner: true,
                },
            })
            : [];
        const mappingByApp = new Map(mappings.map((m) => [m.aplikasi?.toLowerCase(), m]));
        const enriched = data.map((vm) => ({
            ...vm,
            mapping: mappingByApp.get(vm.application?.toLowerCase()) ?? null,
        }));
        return {
            data: enriched,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const vm = await this.prisma.vm.findUnique({ where: { id } });
        if (!vm)
            throw new common_1.NotFoundException(`VM with id ${id} not found`);
        const mapping = vm.application
            ? await this.prisma.appMapping.findFirst({
                where: { aplikasi: { equals: vm.application, mode: 'insensitive' } },
                select: {
                    aplikasi: true,
                    team: true,
                    department: true,
                    squadLead: true,
                    kritikalitas: true,
                    applicationOwner: true,
                    platformOwner: true,
                    keterangan: true,
                    support24h: true,
                    target24h: true,
                },
            })
            : null;
        return { ...vm, mapping: mapping ?? null };
    }
    async create(dto) {
        return this.prisma.vm.create({ data: dto });
    }
    async update(id, dto, actor) {
        await this.findOne(id);
        const vm = await this.prisma.vm.update({ where: { id }, data: dto });
        await this.audit.log({ entity: 'Vm', entityId: id, action: 'UPDATE', userId: actor?.id, username: actor?.username, payload: dto });
        return vm;
    }
    async remove(id, actor) {
        await this.findOne(id);
        const vm = await this.prisma.vm.delete({ where: { id } });
        await this.audit.log({ entity: 'Vm', entityId: id, action: 'DELETE', userId: actor?.id, username: actor?.username });
        return vm;
    }
    async findExpiring(days) {
        const today = new Date().toISOString().split('T')[0];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        return this.prisma.vm.findMany({
            where: {
                endSupportDate: { gte: today, lte: cutoffStr },
            },
            orderBy: { endSupportDate: 'asc' },
        });
    }
    async getStats() {
        const [total, byKondisi, byStatusOs, byKritikalitas, byCategory, byVcenter] = await this.prisma.$transaction([
            this.prisma.vm.count(),
            this.prisma.$queryRaw `SELECT kondisi AS label, COUNT(*) AS count FROM vms GROUP BY kondisi ORDER BY count DESC`,
            this.prisma.$queryRaw `SELECT "statusOs" AS label, COUNT(*) AS count FROM vms GROUP BY "statusOs" ORDER BY count DESC`,
            this.prisma.$queryRaw `SELECT kritikalitas AS label, COUNT(*) AS count FROM vms GROUP BY kritikalitas ORDER BY count DESC`,
            this.prisma.$queryRaw `SELECT category AS label, COUNT(*) AS count FROM vms GROUP BY category ORDER BY count DESC`,
            this.prisma.$queryRaw `SELECT vcenter AS label, COUNT(*) AS count FROM vms GROUP BY vcenter ORDER BY count DESC`,
        ]);
        const toList = (rows) => rows.map((r) => ({ label: r.label, count: Number(r.count) }));
        return {
            total,
            byKondisi: toList(byKondisi),
            byStatusOs: toList(byStatusOs),
            byKritikalitas: toList(byKritikalitas),
            byCategory: toList(byCategory),
            byVcenter: toList(byVcenter),
        };
    }
};
exports.VmService = VmService;
exports.VmService = VmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], VmService);
//# sourceMappingURL=vm.service.js.map