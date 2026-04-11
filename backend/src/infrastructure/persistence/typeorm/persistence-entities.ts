import type { EntitySchema, ObjectType } from 'typeorm';

import {
  ExpenseItemEntity,
  ExpenseReportEntity,
  UserEntity,
} from '@backend/infrastructure/persistence/entities';

export type PersistenceEntity = ObjectType<object> | EntitySchema<object> | string;

export const PERSISTENCE_ENTITIES = [
  UserEntity,
  ExpenseReportEntity,
  ExpenseItemEntity,
] as const satisfies readonly PersistenceEntity[];

export function registerPersistenceEntities(
  ...extraEntities: readonly PersistenceEntity[]
): PersistenceEntity[] {
  return Array.from(new Set([...PERSISTENCE_ENTITIES, ...extraEntities]));
}
