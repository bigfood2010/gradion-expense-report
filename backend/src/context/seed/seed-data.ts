import { UserRole } from '@backend/modules/users/domain/user-role.enum';

export interface SeedAccount {
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
}

export const seedAccounts = [
  {
    email: 'user@example.com',
    password: 'password',
    role: UserRole.USER,
  },
  {
    email: 'admin@example.com',
    password: 'password',
    role: UserRole.ADMIN,
  },
] as const satisfies readonly SeedAccount[];
