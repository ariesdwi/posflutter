import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto, requestingUser?: {
        role: string;
    }): Promise<{
        id: number;
        username: string;
        role: string;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            role: string;
        };
    }>;
    getUsers(): Promise<{
        id: number;
        username: string;
        role: string;
        createdAt: Date;
    }[]>;
}
