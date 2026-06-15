import {
  Controller,
  Post,
  Get,
  Body,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** First call creates the ADMIN user; subsequent calls require ADMIN JWT */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Request() req) {
    return this.authService.register(dto, req.user);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@Request() req) {
    return req.user;
  }

  @Roles('ADMIN')
  @Get('users')
  getUsers() {
    return this.authService.getUsers();
  }
}
