import { useEffect, useState, type ReactElement } from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { Button } from '@client/components/atoms/button';
import { Pagination } from '@client/components/molecules/pagination';
import { WorkspaceTemplate } from '@client/components/templates/workspace-template';
import { DashboardSummaryGrid } from '@client/components/organisms/dashboard/dashboard-summary-grid';
import { ReportList } from '@client/components/organisms/dashboard/report-list';
import { useAuth } from '@client/lib/auth-context';
import { useExpenseReportSummaryQuery, useExpenseReportsQuery } from '@client/lib/hooks';
import { motion } from 'framer-motion';

export function DashboardPage(): ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();
  const isAdmin = auth.user?.role === 'admin';
  const scope = auth.user?.id ?? 'me';
  const [page, setPage] = useState(1);

  const reportsQuery = useExpenseReportsQuery(scope, page, auth.isAuthenticated && !isAdmin);
  const summaryQuery = useExpenseReportSummaryQuery(scope, auth.isAuthenticated && !isAdmin);

  const reports = reportsQuery.data?.items ?? [];
  const paginationMeta = reportsQuery.data?.meta ?? null;
  const totalPages = paginationMeta?.totalPages ?? 0;

  useEffect(() => {
    setPage(1);
  }, [scope]);

  // Only clamp when totalPages changes (e.g. after deletion/filtering).
  // page is intentionally excluded — reading it from closure is safe here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages]);

  if (isAdmin) {
    return <Navigate replace to={'/admin' as any} />;
  }

  const summary = summaryQuery.data ?? {
    activeDrafts: 0,
    pendingApproval: 0,
    totalProcessed: 0,
  };

  const openNewReport = () => {
    void navigate({ to: '/reports/create' as any });
  };

  const actions = (
    <div className="flex items-center gap-5">
      <p className="hidden cursor-default select-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground/40 sm:block">
        {auth.user?.name ?? auth.user?.email ?? 'Account'}
      </p>
      <motion.button
        whileHover={{ scale: 1.05, color: '#000' }}
        whileTap={{ scale: 0.95 }}
        type="button"
        className="inline-flex min-h-11 items-center rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground transition-colors duration-200 hover:bg-black/5"
        onClick={() => {
          auth.logout();
          void navigate({ to: '/login' as any });
        }}
      >
        Sign Out
      </motion.button>
    </div>
  );

  return (
    <WorkspaceTemplate
      title="Expenses"
      actions={actions}
      summary={
        <DashboardSummaryGrid
          activeDrafts={summary.activeDrafts}
          pendingApproval={summary.pendingApproval}
          totalProcessed={summary.totalProcessed}
        />
      }
      wide
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-medium tracking-tight text-foreground">Reports</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openNewReport}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-8 text-[14px] font-medium text-white shadow-lg shadow-black/5 transition-opacity hover:opacity-90"
          >
            New Report
          </motion.button>
        </div>

        <ReportList
          emptyAction={<Button onClick={openNewReport}>New Report</Button>}
          error={reportsQuery.error instanceof Error ? reportsQuery.error.message : null}
          loading={reportsQuery.isLoading}
          onRetry={() => {
            void reportsQuery.refetch();
          }}
          reports={reports}
        />
        {!reportsQuery.error && <Pagination meta={paginationMeta} onPageChange={setPage} />}
      </div>
    </WorkspaceTemplate>
  );
}
