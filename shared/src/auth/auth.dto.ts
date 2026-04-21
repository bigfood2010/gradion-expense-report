import type { UserRole } from '@shared/enums';
import type { AuthSessionDto, AuthTokensDto, AuthUserDto } from '@shared/auth/auth.types';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface SignupRequestDto {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export type AuthResponseDto = AuthSessionDto;

export interface AuthUserResponseDto extends AuthUserDto {}

export interface AuthTokensResponseDto extends AuthTokensDto {}
