import type { UserRole } from '@shared/enums';
import type { CurrencyCode, IsoDateTimeString, Uuid } from '@shared/common/primitives';

export interface AuthUserDto {
  id: Uuid;
  email: string;
  role: UserRole;
  name?: string;
}

export interface JwtPayloadDto {
  sub: Uuid;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayloadDto {
  sub: Uuid;
  tokenVersion?: number;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn?: number;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  tokens?: AuthTokensDto;
  issuedAt?: IsoDateTimeString;
}

export interface CurrentUserDto extends AuthUserDto {}

export interface CurrencyPreferenceDto {
  defaultCurrency: CurrencyCode;
}
