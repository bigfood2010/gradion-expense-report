import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRole } from '@backend/modules/users/domain/user-role.enum';
import { AuthService } from '@backend/modules/auth/auth.service';
import type { UserEntity } from '@backend/modules/users/domain/user.entity';
import type { UsersService } from '@backend/modules/users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const baseUser: UserEntity = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.USER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    usersService = {
      createUser: jest.fn(),
      findForAuthByEmail: jest.fn(),
      getByIdOrThrow: jest.fn(),
      getProfile: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt'),
    } as unknown as jest.Mocked<JwtService>;

    authService = new AuthService(usersService, jwtService);
  });

  it('hashes the password and returns an access token on signup', async () => {
    usersService.findForAuthByEmail.mockResolvedValue(null);
    usersService.createUser.mockImplementation(async ({ email, passwordHash, role }) => ({
      ...baseUser,
      email,
      passwordHash,
      role,
    }));

    const result = await authService.signup({
      email: 'user@example.com',
      password: 'P@ssword123',
    });

    expect(usersService.createUser).toHaveBeenCalledTimes(1);
    const createCall = usersService.createUser.mock.calls[0]?.[0];
    expect(createCall?.email).toBe('user@example.com');
    expect(createCall?.role).toBe(UserRole.USER);
    expect(createCall?.passwordHash).not.toBe('P@ssword123');
    expect(await bcrypt.compare('P@ssword123', createCall?.passwordHash ?? '')).toBe(true);
    expect(result).toEqual({
      accessToken: 'signed-jwt',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
      },
    });
  });

  it('rejects duplicate signups', async () => {
    usersService.findForAuthByEmail.mockResolvedValue(baseUser);

    await expect(
      authService.signup({
        email: 'user@example.com',
        password: 'P@ssword123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid credentials on login', async () => {
    usersService.findForAuthByEmail.mockResolvedValue({
      ...baseUser,
      passwordHash: await bcrypt.hash('another-password', 4),
    });

    await expect(
      authService.login({
        email: 'user@example.com',
        password: 'P@ssword123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns an access token on successful login', async () => {
    const passwordHash = await bcrypt.hash('P@ssword123', 4);
    usersService.findForAuthByEmail.mockResolvedValue({
      ...baseUser,
      passwordHash,
    });

    const result = await authService.login({
      email: 'user@example.com',
      password: 'P@ssword123',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.USER,
    });
    expect(result.accessToken).toBe('signed-jwt');
  });
});
