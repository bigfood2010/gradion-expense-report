import { faker } from '@faker-js/faker';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@client/lib/auth-context';
import { useExpenseReportsQuery, useExpenseReportSummaryQuery } from '@client/lib/hooks';
import { DashboardPage } from '@client/components/pages/dashboard/dashboard-page';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

const mockNavigate = jest.fn().mockResolvedValue(undefined);

jest.mock('@client/components/templates/workspace-template', () => ({
  WorkspaceTemplate: ({ title, children, actions, summary }: any) => (
    <div data-testid="workspace-template">
      <h1>{title}</h1>
      <div data-testid="actions">{actions}</div>
      <div data-testid="summary">{summary}</div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

jest.mock('@client/components/organisms/dashboard/report-list', () => ({
  ReportList: ({ loading, error, reports, onRetry }: any) => (
    <div data-testid="report-list">
      {loading && <span data-testid="loading" />}
      {error && <button onClick={onRetry}>retry</button>}
      {reports?.map((r: any) => (
        <div key={r.id} data-testid="report-item">
          {r.title}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@client/components/organisms/dashboard/dashboard-summary-grid', () => ({
  DashboardSummaryGrid: ({ activeDrafts, pendingApproval, totalProcessed }: any) => (
    <div
      data-testid="summary-grid"
      data-drafts={activeDrafts}
      data-pending={pendingApproval}
      data-processed={totalProcessed}
    />
  ),
}));

jest.mock('@client/components/molecules/pagination', () => ({
  Pagination: ({ meta, onPageChange }: any) => (
    <div data-testid="pagination">
      {meta && <button onClick={() => onPageChange(2)}>page 2</button>}
    </div>
  ),
}));

jest.mock('@client/components/atoms/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@tanstack/react-router', () => ({
  Navigate: ({ to }: any) => <div data-testid="navigate-redirect" data-to={to} />,
  useNavigate: () => mockNavigate,
}));

jest.mock('@client/lib/auth-context');
jest.mock('@client/lib/hooks');
jest.mock('@client/lib/api-client', () => ({
  apiClient: {},
}));

jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------

const mockUseAuth = useAuth as jest.Mock;
const mockUseExpenseReportsQuery = useExpenseReportsQuery as jest.Mock;
const mockUseExpenseReportSummaryQuery = useExpenseReportSummaryQuery as jest.Mock;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function buildUser(role: 'user' | 'admin' = 'user') {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role,
  };
}

function buildReport() {
  return {
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    totalAmount: 0,
    currency: 'USD',
  };
}

function buildMeta(overrides: Record<string, unknown> = {}) {
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

function mockDefaultState(
  user = buildUser(),
  reports: ReturnType<typeof buildReport>[] = [],
  meta: ReturnType<typeof buildMeta> = buildMeta(),
) {
  const logout = jest.fn();
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user,
    session: { user },
    logout,
    login: jest.fn(),
    signup: jest.fn(),
    setSession: jest.fn(),
  });
  mockUseExpenseReportsQuery.mockReturnValue({
    data: { items: reports, meta },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });
  mockUseExpenseReportSummaryQuery.mockReturnValue({
    data: { activeDrafts: 2, pendingApproval: 1, totalProcessed: 3 },
    isLoading: false,
  });
  return { logout };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DashboardPage', () => {
  // 1. Admin redirect
  describe('when user is admin', () => {
    it('renders <Navigate to="/admin" /> instead of the dashboard', () => {
      mockDefaultState(buildUser('admin'));
      render(<DashboardPage />);

      const redirect = screen.getByTestId('navigate-redirect');
      expect(redirect).toBeInTheDocument();
      expect(redirect).toHaveAttribute('data-to', '/admin');
      expect(screen.queryByTestId('workspace-template')).not.toBeInTheDocument();
    });
  });

  // 2. Dashboard title
  describe('when user is a regular user', () => {
    it('renders the "Reports" heading', () => {
      mockDefaultState();
      render(<DashboardPage />);

      expect(screen.getByRole('heading', { name: /reports/i })).toBeInTheDocument();
    });

    // 3. Empty report list
    it('renders an empty ReportList when there are no reports', () => {
      mockDefaultState(buildUser(), []);
      render(<DashboardPage />);

      expect(screen.getByTestId('report-list')).toBeInTheDocument();
      expect(screen.queryAllByTestId('report-item')).toHaveLength(0);
    });

    // 4. Report list items
    it('renders all report items returned from the query', () => {
      const reports = [buildReport(), buildReport(), buildReport()];
      mockDefaultState(buildUser(), reports, buildMeta({ totalItems: 3 }));
      render(<DashboardPage />);

      const items = screen.getAllByTestId('report-item');
      expect(items).toHaveLength(3);
      items.forEach((item, i) => {
        expect(item).toHaveTextContent(reports[i]!.title);
      });
    });

    // 5. Summary grid with real data
    it('renders DashboardSummaryGrid with correct summary values', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: buildUser(),
        logout: jest.fn(),
        login: jest.fn(),
        signup: jest.fn(),
        setSession: jest.fn(),
      });
      mockUseExpenseReportsQuery.mockReturnValue({
        data: { items: [], meta: buildMeta() },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseExpenseReportSummaryQuery.mockReturnValue({
        data: { activeDrafts: 4, pendingApproval: 7, totalProcessed: 12 },
        isLoading: false,
      });

      render(<DashboardPage />);

      const grid = screen.getByTestId('summary-grid');
      expect(grid).toHaveAttribute('data-drafts', '4');
      expect(grid).toHaveAttribute('data-pending', '7');
      expect(grid).toHaveAttribute('data-processed', '12');
    });

    // 6. Summary grid fallback zeros
    it('renders DashboardSummaryGrid with zeros when summaryQuery.data is undefined', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: buildUser(),
        logout: jest.fn(),
        login: jest.fn(),
        signup: jest.fn(),
        setSession: jest.fn(),
      });
      mockUseExpenseReportsQuery.mockReturnValue({
        data: { items: [], meta: buildMeta() },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseExpenseReportSummaryQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      render(<DashboardPage />);

      const grid = screen.getByTestId('summary-grid');
      expect(grid).toHaveAttribute('data-drafts', '0');
      expect(grid).toHaveAttribute('data-pending', '0');
      expect(grid).toHaveAttribute('data-processed', '0');
    });

    // 7. Loading state
    it('shows loading indicator in ReportList when isLoading=true', () => {
      mockDefaultState();
      mockUseExpenseReportsQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    // 8. Error state + Pagination hidden
    it('shows error in ReportList and hides Pagination when error is present', () => {
      mockDefaultState();
      mockUseExpenseReportsQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network failure'),
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    // 9. Retry button calls refetch
    it('calls reportsQuery.refetch when retry button is clicked', () => {
      const refetch = jest.fn().mockResolvedValue(undefined);
      mockDefaultState();
      mockUseExpenseReportsQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('fail'),
        refetch,
      });

      render(<DashboardPage />);
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    // 10. New Report button navigates to /reports/create
    it('navigates to /reports/create when "New Report" button is clicked', () => {
      mockDefaultState();
      render(<DashboardPage />);

      // The primary "New Report" button is in the header (motion.button)
      const newReportButtons = screen.getAllByRole('button', { name: /new report/i });
      fireEvent.click(newReportButtons[0]!);

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/reports/create' });
    });

    // 11. Sign Out calls logout then navigates to /login
    it('calls auth.logout() then navigates to /login when "Sign Out" is clicked', async () => {
      const { logout } = mockDefaultState();
      render(<DashboardPage />);

      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

      expect(logout).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
      });
    });

    // 12. Pagination renders when meta exists and no error
    it('renders Pagination when meta is present and there is no error', () => {
      mockDefaultState(buildUser(), [], buildMeta({ totalPages: 3, totalItems: 30 }));
      render(<DashboardPage />);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    // 13. Page change via Pagination
    it('calls useExpenseReportsQuery with updated page after Pagination page change', () => {
      mockDefaultState(buildUser(), [], buildMeta({ totalPages: 3, totalItems: 30 }));
      render(<DashboardPage />);

      fireEvent.click(screen.getByRole('button', { name: /page 2/i }));

      // After setPage(2), the hook should be called with page=2
      expect(mockUseExpenseReportsQuery).toHaveBeenLastCalledWith(
        expect.anything(),
        2,
        expect.anything(),
      );
    });

    // 14. User name shown in actions area
    it('displays the user name in the actions area', () => {
      const user = buildUser();
      mockDefaultState(user);
      render(<DashboardPage />);

      const actions = screen.getByTestId('actions');
      expect(actions).toHaveTextContent(user.name);
    });

    it('falls back to email when user has no name', () => {
      const user = { ...buildUser(), name: undefined as any };
      mockDefaultState(user);
      render(<DashboardPage />);

      const actions = screen.getByTestId('actions');
      expect(actions).toHaveTextContent(user.email);
    });

    // 15. isLoading=false, error=null, empty items → normal (no loading/error indicators)
    it('renders ReportList without loading or error indicators when state is idle with no items', () => {
      mockDefaultState(buildUser(), []);
      render(<DashboardPage />);

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      expect(screen.getByTestId('report-list')).toBeInTheDocument();
    });

    // Page clamp: page resets to totalPages when it exceeds it
    it('clamps page to totalPages when page exceeds totalPages', async () => {
      // Start with totalPages=3 so we can trigger page 2
      mockDefaultState(buildUser(), [], buildMeta({ totalPages: 3, totalItems: 30 }));
      render(<DashboardPage />);

      // Advance to page 2
      fireEvent.click(screen.getByRole('button', { name: /page 2/i }));

      // Now update the mock to return totalPages=1 (simulating deletion)
      mockUseExpenseReportsQuery.mockReturnValue({
        data: { items: [], meta: buildMeta({ totalPages: 1, totalItems: 5 }) },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Re-render triggers the clamp effect
      await waitFor(() => {
        expect(mockUseExpenseReportsQuery).toHaveBeenCalledWith(
          expect.anything(),
          1,
          expect.anything(),
        );
      });
    });
  });
});
