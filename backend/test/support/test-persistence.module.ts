import { Test, type TestingModule } from '@nestjs/testing';

import { createPersistenceRepositoryProviders } from './in-memory-persistence-repositories';
import { TestReportWorkflowService } from './report-workflow.service';

export async function createPersistenceTestingModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [...createPersistenceRepositoryProviders(), TestReportWorkflowService],
  }).compile();
}
