import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: any): Promise<{
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
    me(req: any): any;
    getUsers(): Promise<{
        id: number;
        username: string;
        role: string;
        createdAt: Date;
    }[]>;
}
