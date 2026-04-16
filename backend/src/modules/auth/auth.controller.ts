import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import ms from 'ms';

import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAME, AUTH_DEFAULT_JWT_EXPIRES_IN } from './constants/auth.constants';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

function cookieOptions(isProduction: boolean, maxAgeMs: number): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: maxAgeMs,
    path: '/',
  };
}

@Controller('auth')
export class AuthController {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly cookieMaxAgeMs: number;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? AUTH_DEFAULT_JWT_EXPIRES_IN;
    this.cookieMaxAgeMs = ms(jwtExpiresIn as ms.StringValue);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('signup')
  async signup(
    @Body() payload: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.signup(payload);
    response.cookie(AUTH_COOKIE_NAME, accessToken, cookieOptions(this.isProduction, this.cookieMaxAgeMs));
    return { user };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(payload);
    response.cookie(AUTH_COOKIE_NAME, accessToken, cookieOptions(this.isProduction, this.cookieMaxAgeMs));
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser | undefined): AuthResponseDto {
    if (!user) {
      throw new UnauthorizedException('Authentication is required.');
    }
    return { user };
  }
}
