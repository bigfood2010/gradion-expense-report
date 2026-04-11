import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUuidDefaultsToPrimaryKeys1775845415682 implements MigrationInterface {
  name = 'AddUuidDefaultsToPrimaryKeys1775845415682';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
    `);

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
    `);

    await queryRunner.query(`
      ALTER TABLE "expense_items"
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "expense_items"
      ALTER COLUMN "id" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      ALTER COLUMN "id" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "id" DROP DEFAULT
    `);
  }
}
