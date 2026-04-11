import { WorkspaceTemplate } from '@client/components/templates/workspace-template';
import { AdminReportsTable } from '@client/components/organisms/admin/admin-reports-table';
import { Pagination } from '@client/components/molecules/pagination';
import { motion } from 'framer-motion';
import type { AdminDashboardPageProps } from './admin.types';

export function AdminDashboardPage({
  activeReportId,
  approvingReportId,
  currentUser,
  isLoading,
  onPageChange,
  onApproveReport,
  onRejectReport,
  onSignOut,
  onToggleReport,
  rejectingReportId,
  paginationMeta,
  reports,
}: AdminDashboardPageProps) {
  const actions = (
    <div className="flex items-center gap-5">
      <p className="hidden cursor-default select-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground/40 sm:block">
        {currentUser?.email || 'Admin session'}
      </p>
      {onSignOut && (
        <motion.button
          whileHover={{ scale: 1.05, color: '#000' }}
          whileTap={{ scale: 0.95 }}
          type="button"
          className="inline-flex min-h-10 items-center rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground transition-colors duration-200 hover:bg-black/5"
          onClick={onSignOut}
        >
          Sign Out
        </motion.button>
      )}
    </div>
  );

  const summary = (
    <div className="flex items-center gap-3 border-l border-black/[0.06] pl-6 transition-all duration-300 hover:border-black/[0.12]">
      <span className="text-[28px] font-medium tracking-tighter leading-none">
        {paginationMeta?.totalItems ?? reports.length}
      </span>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 whitespace-nowrap">
          Total Submissions
        </span>
        <span className="text-[9px] font-medium text-muted-foreground/40 font-bold">
          Active Reports
        </span>
      </div>
    </div>
  );

  return (
    <WorkspaceTemplate title="Expense Oversight" actions={actions} summary={summary} wide>
      {isLoading ? (
        <div className="space-y-4 rounded-[22px] border border-black/[0.03] bg-white p-6 shadow-sm">
          <div className="h-8 w-1/3 animate-pulse rounded-lg bg-black/[0.02]" />
          <div className="h-16 animate-pulse rounded-xl bg-black/[0.02]" />
          <div className="h-16 animate-pulse rounded-xl bg-black/[0.02]" />
          <div className="h-16 animate-pulse rounded-xl bg-black/[0.02]" />
        </div>
      ) : (
        <div className="space-y-6">
          <AdminReportsTable
            activeReportId={activeReportId}
            approvingReportId={approvingReportId}
            onApproveReport={onApproveReport}
            onRejectReport={onRejectReport}
            onToggleReport={onToggleReport}
            rejectingReportId={rejectingReportId}
            reports={reports}
          />
          <Pagination meta={paginationMeta} onPageChange={onPageChange} />
        </div>
      )}
    </WorkspaceTemplate>
  );
}
