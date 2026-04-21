import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1775845415681 implements MigrationInterface {
  name = 'CreateInitialSchema1775845415681';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid                  NOT NULL,
        "email"         character varying(320) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role"          character varying      NOT NULL DEFAULT 'user',
        "created_at"    TIMESTAMP              NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('user', 'admin'))
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE "expense_reports" (
        "id"          uuid                  NOT NULL,
        "user_id"     uuid                  NOT NULL,
        "title"       character varying(160) NOT NULL,
        "description" text,
        "status"      character varying      NOT NULL DEFAULT 'DRAFT',
        "currency"    character varying(3)   NOT NULL DEFAULT 'USD',
        "created_at"  TIMESTAMP              NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expense_reports" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_expense_reports_status"
          CHECK ("status" IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
        CONSTRAINT "FK_expense_reports_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "expense_reports_user_status_idx" ON "expense_reports" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE TABLE "expense_items" (
        "id"               uuid                   NOT NULL,
        "report_id"        uuid                   NOT NULL,
        "merchant_name"    character varying(160),
        "description"      text,
        "amount"           numeric(12, 2),
        "currency"         character varying(3),
        "category"         character varying(80),
        "transaction_date" date,
        "receipt_url"      character varying(2048),
        "receipt_object_key"    character varying(1024),
        "receipt_original_name" character varying(512),
        "receipt_mime_type"     character varying(128),
        "receipt_size"          integer,
        "extraction_error"      text,
        "ai_status"        character varying       NOT NULL DEFAULT 'PENDING',
        "ai_extracted"     boolean                 NOT NULL DEFAULT false,
        "created_at"       TIMESTAMP               NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP               NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expense_items" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_expense_items_ai_status"
          CHECK ("ai_status" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
        CONSTRAINT "FK_expense_items_report_id"
          FOREIGN KEY ("report_id") REFERENCES "expense_reports" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "expense_items_report_idx" ON "expense_items" ("report_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "expense_items_report_ai_status_idx" ON "expense_items" ("report_id", "ai_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "expense_items_report_ai_status_idx"`);
    await queryRunner.query(`DROP INDEX "expense_items_report_idx"`);
    await queryRunner.query(`DROP TABLE "expense_items"`);
    await queryRunner.query(`DROP INDEX "expense_reports_user_status_idx"`);
    await queryRunner.query(`DROP TABLE "expense_reports"`);
    await queryRunner.query(`DROP INDEX "users_email_unique"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
