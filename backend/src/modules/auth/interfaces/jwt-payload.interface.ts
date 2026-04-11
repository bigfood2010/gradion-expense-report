import type { UserRole } from '@backend/modules/users/domain/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
