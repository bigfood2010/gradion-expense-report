import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRole } from '@backend/modules/users/domain/user-role.enum';
import { UserResponseDto } from '@backend/modules/users/dto/user-response.dto';
import { UsersService } from '@backend/modules/users/users.service';
import { AUTH_BCRYPT_SALT_ROUNDS } from './constants/auth.constants';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import type { UserEntity } from '@backend/modules/users/domain/user.entity';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

interface AuthUserResponse {
  user: UserResponseDto;
}

interface AuthTokenPayload {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(payload: SignupDto): Promise<AuthUserResponse & AuthTokenPayload> {
    const existingUser = await this.usersService.findForAuthByEmail(payload.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(payload.password, AUTH_BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.createUser({
      email: payload.email,
      passwordHash,
      role: UserRole.USER,
    });

    return this.buildAuthResponse(user);
  }

  async login(payload: LoginDto): Promise<AuthUserResponse & AuthTokenPayload> {
    const user = await this.usersService.findForAuthByEmail(payload.email);
    const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: UserEntity): Promise<AuthUserResponse & AuthTokenPayload> {
    return {
      accessToken: await this.jwtService.signAsync(this.createJwtPayload(user)),
      user: UserResponseDto.fromEntity(user),
    };
  }

  private createJwtPayload(user: UserEntity): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
