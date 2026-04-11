import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@backend/modules/auth/decorators/current-user.decorator';
import { Roles } from '@backend/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@backend/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@backend/modules/auth/guards/roles.guard';
import { UserRole } from '@backend/modules/users/domain/user-role.enum';
import { UserResponseDto } from '@backend/modules/users/dto/user-response.dto';
import { UsersService } from '@backend/modules/users/users.service';
import type { AuthenticatedUser } from '@backend/modules/auth/interfaces/authenticated-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(UserRole.USER, UserRole.ADMIN)
  getCurrentUserProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.getProfile(user.id);
  }
}
