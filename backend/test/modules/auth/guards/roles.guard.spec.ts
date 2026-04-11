import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '@backend/modules/users/domain/user-role.enum';
import { RolesGuard } from '@backend/modules/auth/guards/roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Reflector>;

  const guard = new RolesGuard(reflector);

  const createContext = (role?: UserRole): ExecutionContext =>
    ({
      getHandler: () => function handler() {},
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({
          user:
            role === undefined
              ? undefined
              : {
                  id: 'user-1',
                  email: 'user@example.com',
                  role,
                },
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
  });

  it('allows access when no roles metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('rejects unauthenticated requests when roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it('rejects requests without a matching role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext(UserRole.USER))).toThrow(ForbiddenException);
  });

  it('allows requests with a matching role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
  });
});
