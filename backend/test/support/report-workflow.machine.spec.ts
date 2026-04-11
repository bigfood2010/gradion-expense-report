import { ReportWorkflowError, ReportWorkflowMachine } from './report-workflow.machine';

describe('ReportWorkflowMachine', () => {
  it('allows draft reports to be submitted by users', () => {
    const workflow = new ReportWorkflowMachine('DRAFT');

    expect(workflow.submit('user')).toBe('SUBMITTED');
    expect(workflow.currentStatus).toBe('SUBMITTED');
  });

  it('allows admins to approve submitted reports', () => {
    const workflow = new ReportWorkflowMachine('SUBMITTED');

    expect(workflow.approve('admin')).toBe('APPROVED');
  });

  it('allows admins to reject submitted reports and user edits reset them to draft', () => {
    const workflow = new ReportWorkflowMachine('SUBMITTED');

    expect(workflow.reject('admin')).toBe('REJECTED');
    expect(workflow.applyUserItemMutation('user')).toBe('DRAFT');
  });

  it('blocks item edits outside editable states', () => {
    expect(ReportWorkflowMachine.canMutateItems('DRAFT')).toBe(true);
    expect(ReportWorkflowMachine.canMutateItems('REJECTED')).toBe(true);
    expect(ReportWorkflowMachine.canMutateItems('SUBMITTED')).toBe(false);
    expect(ReportWorkflowMachine.canMutateItems('APPROVED')).toBe(false);

    const workflow = new ReportWorkflowMachine('SUBMITTED');

    expect(() => workflow.applyUserItemMutation('user')).toThrow(ReportWorkflowError);
  });

  it('rejects invalid role/state combinations', () => {
    const workflow = new ReportWorkflowMachine('DRAFT');

    expect(() => workflow.submit('admin')).toThrow('Action requires user role.');
    expect(() => workflow.approve('admin')).toThrow('Only submitted reports can be approved.');
  });
});
