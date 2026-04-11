import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  type CreateUserParams,
  USERS_REPOSITORY,
  type UsersRepository,
} from './domain/user.repository';
import { UserEntity } from './domain/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async createUser(params: CreateUserParams): Promise<UserEntity> {
    return this.usersRepository.create(params);
  }

  async findForAuthByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  async getByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(id: string): Promise<UserResponseDto> {
    const user = await this.getByIdOrThrow(id);

    return UserResponseDto.fromEntity(user);
  }
}
