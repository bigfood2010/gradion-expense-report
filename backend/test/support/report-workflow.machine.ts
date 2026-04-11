import { REPORT_STATUSES, type ReportStatus } from '@gradion/shared/enums';

export type WorkflowActor = 'user' | 'admin';

export class ReportWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportWorkflowError';
  }
}

const EDITABLE_STATUSES = new Set<ReportStatus>(['DRAFT', 'REJECTED']);
const STATUS_SET = new Set<ReportStatus>(REPORT_STATUSES);

function assertRole(expected: WorkflowActor, actual: WorkflowActor): void {
  if (expected !== actual) {
    throw new ReportWorkflowError(`Action requires ${expected} role.`);
  }
}

function assertStatus(status: string): asserts status is ReportStatus {
  if (!STATUS_SET.has(status as ReportStatus)) {
    throw new ReportWorkflowError(`Unknown report status: ${status}`);
  }
}

export class ReportWorkflowMachine {
  private status: ReportStatus;

  constructor(status: ReportStatus) {
    assertStatus(status);
    this.status = status;
  }

  static canMutateItems(status: ReportStatus): boolean {
    return EDITABLE_STATUSES.has(status);
  }

  get currentStatus(): ReportStatus {
    return this.status;
  }

  submit(actor: WorkflowActor): ReportStatus {
    assertRole('user', actor);

    if (this.status !== 'DRAFT') {
      throw new ReportWorkflowError('Only draft reports can be submitted.');
    }

    this.status = 'SUBMITTED';
    return this.status;
  }

  approve(actor: WorkflowActor): ReportStatus {
    assertRole('admin', actor);

    if (this.status !== 'SUBMITTED') {
      throw new ReportWorkflowError('Only submitted reports can be approved.');
    }

    this.status = 'APPROVED';
    return this.status;
  }

  reject(actor: WorkflowActor): ReportStatus {
    assertRole('admin', actor);

    if (this.status !== 'SUBMITTED') {
      throw new ReportWorkflowError('Only submitted reports can be rejected.');
    }

    this.status = 'REJECTED';
    return this.status;
  }

  applyUserItemMutation(actor: WorkflowActor): ReportStatus {
    assertRole('user', actor);

    if (this.status === 'REJECTED') {
      this.status = 'DRAFT';
      return this.status;
    }

    if (this.status === 'DRAFT') {
      return this.status;
    }

    throw new ReportWorkflowError('Items can only be modified while a report is editable.');
  }
}
