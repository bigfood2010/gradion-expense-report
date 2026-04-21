import { render, screen } from '@testing-library/react';

import { AdminReportsTable } from '@client/components/organisms/admin/admin-reports-table';
import type { AdminReportView } from '@client/components/pages/admin/admin.types';

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, layout, variants, initial, animate, exit, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, whileHover, whileTap, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
}));

function buildReport(overrides = {}): AdminReportView {
  return {
    id: 'report-1',
    title: 'Submitted report',
    description: 'Trip to Tokyo',
    userId: 'user-1',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
    totalAmount: 38.02,
    currency: 'USD',
    status: 'SUBMITTED',
    items: [],
    user: { id: 'user-1', email: 'sarah@openai.com', role: 'user' },
    canEdit: false,
    ...overrides,
  } as AdminReportView;
}

describe('AdminReportsTable', () => {
  it('shares the same desktop grid template between header and body rows', () => {
    const { container } = render(
      <AdminReportsTable
        activeReportId={null}
        approvingReportId={null}
        onApproveReport={jest.fn()}
        onRejectReport={jest.fn()}
        onToggleReport={jest.fn()}
        rejectingReportId={null}
        reports={[buildReport()]}
      />,
    );

    const sharedGridTemplate =
      'md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_120px_120px_110px]';
    const headerRow = container.querySelector('.hidden.border-b');
    const bodyRow = container.querySelector('.group');
    const bodyButton = container.querySelector('.group button');

    expect(screen.getByText('Status')).toHaveClass('text-center');
    expect(headerRow).toHaveClass(sharedGridTemplate);
    expect(bodyRow).toHaveClass(sharedGridTemplate);
    expect(bodyButton).toHaveClass('md:[grid-template-columns:subgrid]');
    expect(container.querySelector('.justify-self-center .status-badge')).toBeInTheDocument();
  });
});
