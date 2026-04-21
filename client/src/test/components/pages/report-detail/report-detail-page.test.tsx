import { render, screen, fireEvent } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { ReportDetailPage } from '@client/components/pages/report-detail/report-detail-page';
import type { ReportDetailPageProps } from '@client/components/pages/report-detail/report-detail.types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@client/components/templates/workspace-template', () => ({
  WorkspaceTemplate: ({ title, children, actions, leftAction }: any) => (
    <div data-testid="workspace">
      <div data-testid="left-action">{leftAction}</div>
      <div data-testid="title">{title}</div>
      <div data-testid="actions">{actions}</div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

jest.mock('@client/components/organisms/report/report-detail-view', () => ({
  ReportDetailView: ({ report }: any) => (
    <div data-testid="report-detail-view">{report?.title}</div>
  ),
}));

jest.mock('@client/components/organisms/report/report-receipt-drawer', () => ({
  ReportReceiptDrawer: ({ drawer, onClose }: any) => (
    <div data-testid="receipt-drawer" data-open={String(drawer.open)}>
      <button onClick={onClose}>close-drawer</button>
    </div>
  ),
}));

jest.mock('@client/components/organisms/report/report-leave-confirm-dialog', () => ({
  ReportLeaveConfirmDialog: ({ open, onCancel, onConfirm }: any) => (
    <div data-testid="leave-confirm" data-open={String(open)}>
      <button onClick={onCancel}>cancel-leave</button>
      <button onClick={onConfirm}>confirm-leave</button>
    </div>
  ),
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <svg data-testid="arrow-left" />,
}));

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function buildReport(overrides = {}): any {
  return {
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalAmount: 0,
    currency: 'USD',
    items: [],
    description: null,
    userId: faker.string.uuid(),
    ...overrides,
  };
}

function buildDrawer(overrides = {}) {
  return {
    open: false,
    step: 'upload' as const,
    fileName: null,
    pendingItemId: null,
    error: null,
    ...overrides,
  };
}

function buildDraft(overrides = {}) {
  return {
    merchant: '',
    description: '',
    amount: '',
    currency: 'USD',
    date: '',
    receiptUrl: null,
    aiExtractedFields: {},
    ...overrides,
  };
}

function defaultProps(overrides: Partial<ReportDetailPageProps> = {}): ReportDetailPageProps {
  return {
    currentUser: {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: 'user',
    } as any,
    report: buildReport(),
    isLoading: false,
    isSavingTitle: false,
    isSubmitting: false,
    isUploadingReceipt: false,
    isSavingReceipt: false,
    canSubmitReport: true,
    titleIsDirty: false,
    deletingItemId: null,
    drawer: buildDrawer(),
    draft: buildDraft(),
    reportTitle: faker.commerce.productName(),
    reportTitleError: null,
    leaveConfirmOpen: false,
    onBack: jest.fn(),
    onCancelLeaveConfirm: jest.fn(),
    onConfirmLeaveConfirm: jest.fn(),
    onSignOut: jest.fn(),
    onOpenDrawer: jest.fn(),
    onCloseDrawer: jest.fn(),
    onChooseReceipt: jest.fn(),
    onRetryUpload: jest.fn(),
    onDraftChange: jest.fn(),
    onReportTitleChange: jest.fn(),
    onReportTitleCommit: jest.fn(),
    onReportTitleDiscard: jest.fn(),
    onSaveReceipt: jest.fn(),
    onSubmitReport: jest.fn(),
    onDeleteItem: jest.fn(),
    onReviewItem: jest.fn(),
    ...overrides,
  } as ReportDetailPageProps;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportDetailPage', () => {
  describe('Content rendering based on state', () => {
    it('renders ReportDetailView when report is present and isLoading=false', () => {
      render(<ReportDetailPage {...defaultProps()} />);
      expect(screen.getByTestId('report-detail-view')).toBeInTheDocument();
    });

    it('shows "Report Not Found" heading when report=null and isLoading=false', () => {
      render(<ReportDetailPage {...defaultProps({ report: null, isLoading: false })} />);
      expect(screen.getByRole('heading', { name: /report not found/i })).toBeInTheDocument();
    });

    it('shows loading skeleton (animate-pulse element) when isLoading=true', () => {
      const { container } = render(<ReportDetailPage {...defaultProps({ isLoading: true })} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('does NOT render ReportDetailView when isLoading=true', () => {
      render(<ReportDetailPage {...defaultProps({ isLoading: true })} />);
      expect(screen.queryByTestId('report-detail-view')).not.toBeInTheDocument();
    });

    it('does NOT render ReportDetailView when report=null', () => {
      render(<ReportDetailPage {...defaultProps({ report: null, isLoading: false })} />);
      expect(screen.queryByTestId('report-detail-view')).not.toBeInTheDocument();
    });
  });

  describe('WorkspaceTemplate title', () => {
    it('uses report.title as workspace title when report is present', () => {
      const report = buildReport({ title: 'My Travel Expenses' });
      render(<ReportDetailPage {...defaultProps({ report })} />);
      expect(screen.getByTestId('title')).toHaveTextContent('My Travel Expenses');
    });

    it('falls back to "Report Detail" as title when report is null', () => {
      render(<ReportDetailPage {...defaultProps({ report: null, isLoading: false })} />);
      expect(screen.getByTestId('title')).toHaveTextContent('Report Detail');
    });
  });

  describe('Back button', () => {
    it('calls onBack when Back button is clicked', () => {
      const onBack = jest.fn();
      render(<ReportDetailPage {...defaultProps({ onBack })} />);
      fireEvent.click(screen.getByText('Back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders the ArrowLeft icon inside the Back button', () => {
      render(<ReportDetailPage {...defaultProps()} />);
      expect(screen.getByTestId('arrow-left')).toBeInTheDocument();
    });
  });

  describe('Sign Out button', () => {
    it('renders Sign Out button when onSignOut prop is provided', () => {
      render(<ReportDetailPage {...defaultProps({ onSignOut: jest.fn() })} />);
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('calls onSignOut when Sign Out button is clicked', () => {
      const onSignOut = jest.fn();
      render(<ReportDetailPage {...defaultProps({ onSignOut })} />);
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
      expect(onSignOut).toHaveBeenCalledTimes(1);
    });

    it('does NOT render Sign Out button when onSignOut is not provided', () => {
      const props = defaultProps();
      delete props.onSignOut;
      render(<ReportDetailPage {...props} />);
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    });
  });

  describe('Current user display in actions', () => {
    it('shows currentUser name in actions area', () => {
      const currentUser = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: 'Alice Smith',
        role: 'user' as any,
      };
      render(<ReportDetailPage {...defaultProps({ currentUser })} />);
      expect(screen.getByTestId('actions')).toHaveTextContent('Alice Smith');
    });

    it('falls back to email when currentUser has no name', () => {
      const currentUser = {
        id: faker.string.uuid(),
        email: 'alice@example.com',
        name: undefined,
        role: 'user' as any,
      };
      render(<ReportDetailPage {...defaultProps({ currentUser })} />);
      expect(screen.getByTestId('actions')).toHaveTextContent('alice@example.com');
    });
  });

  describe('Always-rendered child components', () => {
    it('always renders ReportReceiptDrawer even when loading', () => {
      render(<ReportDetailPage {...defaultProps({ isLoading: true })} />);
      expect(screen.getByTestId('receipt-drawer')).toBeInTheDocument();
    });

    it('always renders ReportReceiptDrawer when report is null', () => {
      render(<ReportDetailPage {...defaultProps({ report: null, isLoading: false })} />);
      expect(screen.getByTestId('receipt-drawer')).toBeInTheDocument();
    });

    it('always renders ReportLeaveConfirmDialog', () => {
      render(<ReportDetailPage {...defaultProps()} />);
      expect(screen.getByTestId('leave-confirm')).toBeInTheDocument();
    });

    it('always renders ReportLeaveConfirmDialog when loading', () => {
      render(<ReportDetailPage {...defaultProps({ isLoading: true })} />);
      expect(screen.getByTestId('leave-confirm')).toBeInTheDocument();
    });
  });

  describe('Drawer and dialog interactions', () => {
    it('calls onCloseDrawer when drawer close button is clicked', () => {
      const onCloseDrawer = jest.fn();
      render(<ReportDetailPage {...defaultProps({ onCloseDrawer })} />);
      fireEvent.click(screen.getByText('close-drawer'));
      expect(onCloseDrawer).toHaveBeenCalledTimes(1);
    });

    it('calls onCancelLeaveConfirm when leave dialog cancel button is clicked', () => {
      const onCancelLeaveConfirm = jest.fn();
      render(<ReportDetailPage {...defaultProps({ onCancelLeaveConfirm })} />);
      fireEvent.click(screen.getByText('cancel-leave'));
      expect(onCancelLeaveConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirmLeaveConfirm when leave dialog confirm button is clicked', () => {
      const onConfirmLeaveConfirm = jest.fn();
      render(<ReportDetailPage {...defaultProps({ onConfirmLeaveConfirm })} />);
      fireEvent.click(screen.getByText('confirm-leave'));
      expect(onConfirmLeaveConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
