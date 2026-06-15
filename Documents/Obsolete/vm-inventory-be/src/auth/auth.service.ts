import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, requestingUser?: { role: string }) {
    // First user can register freely; subsequent registrations require ADMIN
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      if (!requestingUser || requestingUser.role !== 'ADMIN') {
        throw new ForbiddenException('Only ADMIN can create new users');
      }
    }

    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username already taken');

    const hashed = await bcrypt.hash(dto.password, 12);
    const role = userCount === 0 ? 'ADMIN' : (dto.role ?? 'VIEWER');

    const user = await this.prisma.user.create({
      data: { username: dto.username, password: hashed, role },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

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
}
