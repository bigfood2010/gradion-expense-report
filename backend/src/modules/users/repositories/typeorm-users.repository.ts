import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { normalizeUserEmail } from '@backend/modules/users/domain/normalize-user-email';
import { CreateUserParams, UsersRepository } from '@backend/modules/users/domain/user.repository';
import { UserEntity } from '@backend/modules/users/domain/user.entity';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(params: CreateUserParams): Promise<UserEntity> {
    const user = this.repository.create({
      email: normalizeUserEmail(params.email),
      passwordHash: params.passwordHash,
      role: params.role,
    });

    return this.repository.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: normalizeUserEmail(email) })
      .getOne();
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }
}
