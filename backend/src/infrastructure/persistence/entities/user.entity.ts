import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { generateId } from '@backend/common';
import { UserRole } from '@backend/modules/users/domain/user-role.enum';
import { ExpenseReportEntity } from '@backend/infrastructure/persistence/entities/expense-report.entity';

@Entity({ name: 'users' })
@Index('users_email_unique', ['email'], { unique: true })
export class UserEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @BeforeInsert()
  protected assignId(): void {
    this.id ??= generateId();
  }

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @OneToMany(() => ExpenseReportEntity, (report) => report.user)
  reports!: ExpenseReportEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
