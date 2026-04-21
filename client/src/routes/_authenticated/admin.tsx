import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { AdminDashboardPage } from '../../components/pages/admin/admin-dashboard-page';
import {
  useAdminExpenseReportsQuery,
  useApproveExpenseReportMutation,
  useAuthSession,
  useRejectExpenseReportMutation,
} from '../../lib/hooks';

export const Route = createFileRoute('/_authenticated/admin' as any)({
  component: AdminRoute,
});

function AdminRoute() {
  const { signOut, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';
  const userId = user?.id ?? 'anonymous';
  const [page, setPage] = useState(1);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [approvingReportId, setApprovingReportId] = useState<string | null>(null);
  const [rejectingReportId, setRejectingReportId] = useState<string | null>(null);
  const reportsQuery = useAdminExpenseReportsQuery(page, isAdmin);
  const approveReportMutation = useApproveExpenseReportMutation();
  const rejectReportMutation = useRejectExpenseReportMutation();
  const reports = reportsQuery.data?.items ?? [];
  const paginationMeta = reportsQuery.data?.meta ?? null;
  const totalPages = paginationMeta?.totalPages ?? 0;

  useEffect(() => {
    setPage(1);
  }, [userId]);

  useEffect(() => {
    if (totalPages === 0 && page !== 1) {
      setPage(1);
      return;
    }

    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const handleApproveReport = useCallback(
    async (reportId: string) => {
      setApprovingReportId(reportId);

      try {
        await approveReportMutation.mutateAsync({ reportId });
      } finally {
        setApprovingReportId(null);
      }
    },
    [approveReportMutation],
  );

  const handleRejectReport = useCallback(
    async (reportId: string) => {
      setRejectingReportId(reportId);

      try {
        await rejectReportMutation.mutateAsync({ reportId });
      } finally {
        setRejectingReportId(null);
      }
    },
    [rejectReportMutation],
  );

  const handleToggleReport = useCallback((reportId: string) => {
    setActiveReportId((current) => (current === reportId ? null : reportId));
  }, []);

  return (
    <AdminDashboardPage
      activeReportId={activeReportId}
      approvingReportId={approvingReportId}
      currentUser={user}
      isLoading={reportsQuery.isLoading}
      paginationMeta={paginationMeta}
      onApproveReport={handleApproveReport}
      onPageChange={setPage}
      onRejectReport={handleRejectReport}
      onSignOut={signOut}
      onToggleReport={handleToggleReport}
      rejectingReportId={rejectingReportId}
      reports={reports}
    />
  );
}
