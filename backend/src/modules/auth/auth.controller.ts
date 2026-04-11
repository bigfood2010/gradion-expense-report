import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';

import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAME } from './constants/auth.constants';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

const ONE_HOUR_MS = 60 * 60 * 1000;

function cookieOptions(isProduction: boolean): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: ONE_HOUR_MS,
    path: '/',
  };
}

@Controller('auth')
export class AuthController {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() payload: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.signup(payload);
    response.cookie(AUTH_COOKIE_NAME, accessToken, cookieOptions(this.isProduction));
    return { user };
  }

  @Public()
  @Post('login')
  async login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(payload);
    response.cookie(AUTH_COOKIE_NAME, accessToken, cookieOptions(this.isProduction));
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
