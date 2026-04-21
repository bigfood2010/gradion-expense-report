import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPmRoles1775845415684 implements MigrationInterface {
  name = 'AddPmRoles1775845415684';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') {
      return;
    }

    // Check if constraint exists before dropping (idempotent)
    const constraintExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'users' AND constraint_name = 'CHK_users_role' AND constraint_type = 'CHECK'
    `);

    if (constraintExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
          DROP CONSTRAINT "CHK_users_role"
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "CHK_users_role"
          CHECK ("role" IN ('user', 'admin', 'pm', 'pm-dev'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "users"
        DROP CONSTRAINT "CHK_users_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "CHK_users_role"
          CHECK ("role" IN ('user', 'admin'))
    `);
  }
}
