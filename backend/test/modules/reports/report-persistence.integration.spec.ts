import { type TestingModule } from '@nestjs/testing';

import { TestReportWorkflowService } from '../../support/report-workflow.service';
import { createPersistenceTestingModule } from '../../support/test-persistence.module';

describe('Expense report persistence happy path', () => {
  let moduleRef: TestingModule;
  let workflowService: TestReportWorkflowService;

  beforeEach(async () => {
    moduleRef = await createPersistenceTestingModule();
    workflowService = moduleRef.get(TestReportWorkflowService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('persists DRAFT -> SUBMITTED -> APPROVED with stable totals', async () => {
    const draft = await workflowService.createDraftReportWithItem();

    expect(draft.status).toBe('DRAFT');
    expect(draft.items).toHaveLength(1);
    expect(draft.totalAmount).toBe(42.5);

    const submitted = await workflowService.submit(draft.id);
    expect(submitted.status).toBe('SUBMITTED');

    const approved = await workflowService.approve(draft.id);
    expect(approved.status).toBe('APPROVED');
    expect(approved.totalAmount).toBe(42.5);

    const persisted = await workflowService.getReport(draft.id);

    expect(persisted.status).toBe('APPROVED');
    expect(persisted.user.email).toMatch(/^user-\d+@example\.com$/);
    expect(persisted.items[0]?.merchant).toBe('Station Cafe');
    expect(persisted.totalAmount).toBe(42.5);
  });
});
