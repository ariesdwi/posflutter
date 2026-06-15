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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto, requestingUser) {
        const userCount = await this.prisma.user.count();
        if (userCount > 0) {
            if (!requestingUser || requestingUser.role !== 'ADMIN') {
                throw new common_1.ForbiddenException('Only ADMIN can create new users');
            }
        }
        const existing = await this.prisma.user.findUnique({
            where: { username: dto.username },
        });
        if (existing)
            throw new common_1.ConflictException('Username already taken');
        const hashed = await bcrypt.hash(dto.password, 12);
        const role = userCount === 0 ? 'ADMIN' : (dto.role ?? 'VIEWER');
        const user = await this.prisma.user.create({
            data: { username: dto.username, password: hashed, role },
            select: { id: true, username: true, role: true, createdAt: true },
        });
        return user;
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { username: dto.username },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const payload = { sub: user.id, username: user.username, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, username: user.username, role: user.role },
        };
    }
    async getUsers() {
        return this.prisma.user.findMany({
            select: { id: true, username: true, role: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map