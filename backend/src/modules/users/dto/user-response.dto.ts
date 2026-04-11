import type { UserEntity } from '@backend/modules/users/domain/user.entity';
import type { UserRole } from '@backend/modules/users/domain/user-role.enum';

export class UserResponseDto {
  id!: string;
  email!: string;
  role!: UserRole;

  static fromEntity(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
