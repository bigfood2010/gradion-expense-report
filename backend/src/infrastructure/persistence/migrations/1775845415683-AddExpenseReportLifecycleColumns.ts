import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseReportLifecycleColumns1775845415683 implements MigrationInterface {
  name = 'AddExpenseReportLifecycleColumns1775845415683';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      ADD COLUMN "submitted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      ADD COLUMN "approved_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      ADD COLUMN "rejected_at" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      DROP COLUMN "rejected_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      DROP COLUMN "approved_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      DROP COLUMN "submitted_at"
    `);
  }
}
