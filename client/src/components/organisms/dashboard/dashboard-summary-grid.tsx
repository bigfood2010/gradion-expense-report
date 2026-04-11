import type { ReactElement } from 'react';
import { MetricCard } from '@client/components/molecules/metric-card';

export interface DashboardSummaryGridProps {
  readonly activeDrafts: number;
  readonly pendingApproval: number;
  readonly totalProcessed: number;
}

export function DashboardSummaryGrid({
  activeDrafts,
  pendingApproval,
  totalProcessed,
}: DashboardSummaryGridProps): ReactElement {
  return (
    <>
      <MetricCard
        description="Open reports still being edited."
        eyebrow="Active Drafts"
        value={activeDrafts}
        visual="pulse"
      />
      <MetricCard
        description="Reports waiting on review."
        eyebrow="Pending Approval"
        value={pendingApproval}
        visual="scan"
      />
      <MetricCard
        description="Approved and rejected reports."
        eyebrow="Total Processed"
        value={totalProcessed}
        visual="bars"
      />
    </>
  );
}
