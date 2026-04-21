import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { Button } from '@client/components/atoms/button';
import { WorkspaceTemplate } from '@client/components/templates/workspace-template';
import { DashboardSummaryGrid } from '@client/components/organisms/dashboard/dashboard-summary-grid';
import { ReportList } from '@client/components/organisms/dashboard/report-list';
import { useAuth } from '@client/lib/auth-context';
import { useExpenseReportSummaryQuery, useExpenseReportsInfiniteQuery } from '@client/lib/hooks';
import { type ReportStatus } from '@gradion/shared/enums';
import { motion } from 'framer-motion';

export function DashboardPage(): ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();
  const isAdmin = auth.user?.role === 'admin';
  const scope = auth.user?.id ?? 'me';
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);

  const statusFilter = selectedStatus ?? undefined;

  const reportsQuery = useExpenseReportsInfiniteQuery(
    scope,
    statusFilter,
    auth.isAuthenticated && !isAdmin,
  );
  const summaryQuery = useExpenseReportSummaryQuery(scope, auth.isAuthenticated && !isAdmin);

  const reports = reportsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const hasNextPage = reportsQuery.hasNextPage ?? false;
  const isFetchingNextPage = reportsQuery.isFetchingNextPage ?? false;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void reportsQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, reportsQuery]);

  useEffect(() => {
    reportsQuery.refetch();
  }, [scope]);

  useEffect(() => {
    if (reportsQuery.data) {
      void reportsQuery.refetch();
    }
  }, [selectedStatus]);

  if (isAdmin) {
    return <Navigate replace to={'/admin' as any} />;
  }

  const summary = summaryQuery.data ?? {
    draftCount: 0,
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    // Legacy fields
    activeDrafts: 0,
    pendingApproval: 0,
    totalProcessed: 0,
  };

  const statusCounts = {
    draft: summary.draftCount,
    submitted: summary.submittedCount,
    approved: summary.approvedCount,
    rejected: summary.rejectedCount,
    total:
      summary.draftCount + summary.submittedCount + summary.approvedCount + summary.rejectedCount,
  };

  const openNewReport = () => {
    void navigate({ to: '/reports/create' as any });
  };

  const handleStatusChange = (status: ReportStatus | null) => {
    setSelectedStatus(status);
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
          draftCount={statusCounts.draft}
          submittedCount={statusCounts.submitted}
          approvedCount={statusCounts.approved}
          rejectedCount={statusCounts.rejected}
          totalCount={statusCounts.total}
          activeStatus={selectedStatus}
          onStatusChange={handleStatusChange}
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
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
          ) : null}
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
