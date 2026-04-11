import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ExpenseItemEntity } from '@backend/infrastructure/persistence/entities/expense-item.entity';
import { ExpenseReportStatus } from '@backend/modules/reports/reports.types';
import { UserEntity } from '@backend/infrastructure/persistence/entities/user.entity';

@Entity({ name: 'expense_reports' })
@Index('expense_reports_user_status_idx', ['userId', 'status'])
export class ExpenseReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'simple-enum',
    enum: ExpenseReportStatus,
    default: ExpenseReportStatus.DRAFT,
  })
  status!: ExpenseReportStatus;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt!: Date | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt!: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.reports, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @OneToMany(() => ExpenseItemEntity, (item) => item.report, {
    cascade: false,
  })
  items!: ExpenseItemEntity[];

  totalAmount = 0;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @AfterLoad()
  recalculateTotalAmount(): void {
    this.totalAmount = (this.items ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0);
  }
}
