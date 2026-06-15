import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsIn(['ADMIN', 'VIEWER', 'AUDITOR'])
  role?: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
