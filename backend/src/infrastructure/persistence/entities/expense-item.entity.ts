import { AI_STATUSES, type AIStatus } from '@gradion/shared/enums';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { generateId } from '@backend/common';
import { ExpenseReportEntity } from '@backend/infrastructure/persistence/entities/expense-report.entity';
import { decimalColumnTransformer, nullableDecimalColumnTransformer } from './column-transformers';

@Entity({ name: 'expense_items' })
@Index('expense_items_report_idx', ['reportId'])
@Index('expense_items_report_ai_status_idx', ['reportId', 'aiStatus'])
export class ExpenseItemEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @BeforeInsert()
  protected assignId(): void {
    this.id ??= generateId();
  }

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @Column({ name: 'merchant_name', type: 'varchar', length: 160, nullable: true })
  merchant!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: nullableDecimalColumnTransformer,
  })
  amount!: number | null;

  @Column({ type: 'varchar', length: 3, nullable: true, default: null })
  currency!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category!: string | null;

  @Column({ name: 'transaction_date', type: 'date', nullable: true })
  date!: string | null;

  @Column({ name: 'receipt_url', type: 'varchar', length: 2048, nullable: true })
  receiptUrl!: string | null;

  @Column({ name: 'receipt_object_key', type: 'varchar', length: 1024, nullable: true })
  receiptObjectKey!: string | null;

  @Column({ name: 'receipt_original_name', type: 'varchar', length: 512, nullable: true })
  receiptOriginalName!: string | null;

  @Column({ name: 'receipt_mime_type', type: 'varchar', length: 128, nullable: true })
  receiptMimeType!: string | null;

  @Column({ name: 'receipt_size', type: 'int', nullable: true })
  receiptSize!: number | null;

  @Column({ name: 'extraction_error', type: 'text', nullable: true })
  extractionError!: string | null;

  @Column({
    name: 'ai_status',
    type: 'simple-enum',
    enum: AI_STATUSES,
    default: 'PENDING',
  })
  aiStatus!: AIStatus;

  @Column({ name: 'ai_extracted', type: 'boolean', default: false })
  aiExtracted!: boolean;

  @ManyToOne(() => ExpenseReportEntity, (report) => report.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_id' })
  report!: ExpenseReportEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
