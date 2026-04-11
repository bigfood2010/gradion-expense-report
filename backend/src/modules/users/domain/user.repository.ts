import { UserEntity } from './user.entity';
import { UserRole } from './user-role.enum';

export interface CreateUserParams {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UsersRepository {
  create(params: CreateUserParams): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
