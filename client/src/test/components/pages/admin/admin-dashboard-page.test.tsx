import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboardPage } from '@client/components/pages/admin/admin-dashboard-page';

// Simple data helpers (no external dependency needed)
let _seq = 0;
function uid() { return `id-${++_seq}-${Math.random().toString(36).slice(2)}`; }
function email() { return `user${_seq}@example.com`; }
function productName() { return `Product ${uid()}`; }

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@client/components/templates/workspace-template', () => ({
  WorkspaceTemplate: ({ title, children, actions, summary }: any) => (
    <div data-testid="workspace">
      <div data-testid="title">{title}</div>
      <div data-testid="actions">{actions}</div>
      <div data-testid="summary">{summary}</div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

jest.mock('@client/components/organisms/admin/admin-reports-table', () => ({
  AdminReportsTable: ({
    reports,
    onApproveReport,
    onRejectReport,
    onToggleReport,
  }: any) => (
    <div data-testid="admin-reports-table">
      {reports.map((r: any) => (
        <div key={r.id} data-testid="admin-report-row">
          <span>{r.title}</span>
          <button onClick={() => onToggleReport(r.id)}>toggle</button>
          <button onClick={() => onApproveReport(r.id)}>approve</button>
          <button onClick={() => onRejectReport(r.id)}>reject</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@client/components/molecules/pagination', () => ({
  Pagination: ({ meta, onPageChange }: any) => (
    <div data-testid="pagination">
      {meta && <button onClick={() => onPageChange(2)}>page-2</button>}
    </div>
  ),
}));

jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function buildUser(overrides = {}) {
  return {
    id: uid(),
    email: email(),
    role: 'admin' as const,
    name: `Admin User ${_seq}`,
    ...overrides,
  };
}

function buildReport(overrides = {}) {
  return {
    id: uid(),
    title: productName(),
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalAmount: 99.99,
    currency: 'USD',
    items: [],
    description: null,
    userId: uid(),
    user: { id: uid(), email: email() },
    ...overrides,
  };
}

function buildMeta(overrides = {}) {
  return {
    page: 1,
    pageSize: 10,
    totalItems: 5,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    ...overrides,
  };
}

function defaultProps(overrides = {}) {
  return {
    currentUser: buildUser(),
    reports: [],
    paginationMeta: null,
    isLoading: false,
    activeReportId: null,
    approvingReportId: null,
    rejectingReportId: null,
    onToggleReport: jest.fn(),
    onApproveReport: jest.fn(),
    onRejectReport: jest.fn(),
    onPageChange: jest.fn(),
    onSignOut: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminDashboardPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders "Expense Oversight" as the page title', () => {
    render(<AdminDashboardPage {...defaultProps()} />);
    expect(screen.getByTestId('title')).toHaveTextContent('Expense Oversight');
  });

  it('renders currentUser.email in the actions area', () => {
    const user = buildUser();
    render(<AdminDashboardPage {...defaultProps({ currentUser: user })} />);
    expect(screen.getByTestId('actions')).toHaveTextContent(user.email);
  });

  it('falls back to "Admin session" when currentUser is null', () => {
    render(<AdminDashboardPage {...defaultProps({ currentUser: null })} />);
    expect(screen.getByTestId('actions')).toHaveTextContent('Admin session');
  });

  it('falls back to "Admin session" when currentUser is undefined', () => {
    render(<AdminDashboardPage {...defaultProps({ currentUser: undefined })} />);
    expect(screen.getByTestId('actions')).toHaveTextContent('Admin session');
  });

  it('renders Sign Out button when onSignOut prop is provided', () => {
    render(<AdminDashboardPage {...defaultProps({ onSignOut: jest.fn() })} />);
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls onSignOut when Sign Out button is clicked', () => {
    const onSignOut = jest.fn();
    render(<AdminDashboardPage {...defaultProps({ onSignOut })} />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('does not render Sign Out button when onSignOut is not provided', () => {
    const props = defaultProps();
    delete (props as any).onSignOut;
    render(<AdminDashboardPage {...props} onSignOut={undefined} />);
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  it('shows totalItems from paginationMeta in summary', () => {
    const meta = buildMeta({ totalItems: 42 });
    render(<AdminDashboardPage {...defaultProps({ paginationMeta: meta })} />);
    expect(screen.getByTestId('summary')).toHaveTextContent('42');
  });

  it('falls back to reports.length in summary when paginationMeta is null', () => {
    const reports = [buildReport(), buildReport(), buildReport()];
    render(
      <AdminDashboardPage
        {...defaultProps({ reports, paginationMeta: null })}
      />,
    );
    expect(screen.getByTestId('summary')).toHaveTextContent('3');
  });

  it('shows skeleton/loading state when isLoading is true', () => {
    render(<AdminDashboardPage {...defaultProps({ isLoading: true })} />);
    const content = screen.getByTestId('content');
    const skeleton = content.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('does not render AdminReportsTable when isLoading is true', () => {
    render(<AdminDashboardPage {...defaultProps({ isLoading: true })} />);
    expect(screen.queryByTestId('admin-reports-table')).not.toBeInTheDocument();
  });

  it('renders AdminReportsTable when isLoading is false', () => {
    render(<AdminDashboardPage {...defaultProps({ isLoading: false })} />);
    expect(screen.getByTestId('admin-reports-table')).toBeInTheDocument();
  });

  it('renders a row for each report in the reports prop', () => {
    const reports = [buildReport(), buildReport()];
    render(<AdminDashboardPage {...defaultProps({ reports })} />);
    expect(screen.getAllByTestId('admin-report-row')).toHaveLength(2);
  });

  it('calls onToggleReport with the correct reportId when toggle is clicked', () => {
    const report = buildReport();
    const onToggleReport = jest.fn();
    render(
      <AdminDashboardPage
        {...defaultProps({ reports: [report], onToggleReport })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(onToggleReport).toHaveBeenCalledWith(report.id);
  });

  it('calls onApproveReport with the correct reportId when approve is clicked', () => {
    const report = buildReport();
    const onApproveReport = jest.fn();
    render(
      <AdminDashboardPage
        {...defaultProps({ reports: [report], onApproveReport })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'approve' }));
    expect(onApproveReport).toHaveBeenCalledWith(report.id);
  });

  it('calls onRejectReport with the correct reportId when reject is clicked', () => {
    const report = buildReport();
    const onRejectReport = jest.fn();
    render(
      <AdminDashboardPage
        {...defaultProps({ reports: [report], onRejectReport })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'reject' }));
    expect(onRejectReport).toHaveBeenCalledWith(report.id);
  });

  it('renders Pagination when isLoading is false', () => {
    render(<AdminDashboardPage {...defaultProps({ isLoading: false })} />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination triggers a page change', () => {
    const meta = buildMeta({ totalPages: 3, hasNextPage: true });
    const onPageChange = jest.fn();
    render(
      <AdminDashboardPage
        {...defaultProps({ paginationMeta: meta, onPageChange })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'page-2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
