import { SetMetadata } from '@nestjs/common';

import { UserRole } from '@backend/modules/users/domain/user-role.enum';
import { ROLES_KEY } from '../constants/auth.constants';

export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
