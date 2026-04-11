import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './domain/user.entity';
import { USERS_REPOSITORY } from './domain/user.repository';
import { TypeOrmUsersRepository } from './repositories/typeorm-users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [
    UsersService,
    TypeOrmUsersRepository,
    {
      provide: USERS_REPOSITORY,
      useExisting: TypeOrmUsersRepository,
    },
  ],
  exports: [UsersService, USERS_REPOSITORY, TypeOrmModule],
})
export class UsersModule {}
