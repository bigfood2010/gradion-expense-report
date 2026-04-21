You must follow the rules in the following files:

## Conventions

- very little comments, only necessary comments
- no duplicate code, if you need to repeat code, extract it to a function
- your response should be concise, no generic introduction, no generic conclusion, no generic explanation, just the code,
- The impelementation should follow DRY, KISS and YAGNI principles
- use alias for imports
- named imports over default imports
- minimal approach only, do not bring breaking changes to the existing code that have backward compatibility

## Migrations

- When a migration has not yet been applied to any database, fold schema corrections into that same migration file rather than creating a new one — all related schema changes for a feature belong in a single migration, not spread across multiple files.

## Database Schema

- **DB_SYNCHRONIZE is disabled** — Migrations are the single source of truth for the database schema. Do NOT re-enable this setting.
  - Why: `DB_SYNCHRONIZE=true` (TypeORM's auto-sync feature) masks migration bugs. When enabled, schema changes from entities are silently applied without running migrations, creating inconsistency between code and actual DB state. This was discovered in checkpoint 006 when a missing constraint caused a migration to fail.
  - Implication: All schema changes must flow through migrations. Entity-only changes are not applied to the database.
  - If a migration is incomplete or buggy, the error is visible immediately (safe fail), not hidden by auto-sync.
  - Schema coverage is complete and verified: all 3 entities (User, ExpenseReport, ExpenseItem) and all columns are in the migration suite.

## Skills

- nestjs-best-practices.md
- typescript-advanced-types.md
- supabase-postgres-best-practices.md
- vercel-react-best-practices.md

## mcp

- use exa for search
- use context7 for latest document
- use codebase mcp for codebase search and indexing
