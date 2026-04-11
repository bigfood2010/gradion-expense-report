import { fireEvent, render, screen } from '@testing-library/react';

import { ReportDetailView } from '@client/components/organisms/report/report-detail-view';
import type {
  ReportDetailOrganismProps,
  ReportDetailView as ReportDetailModel,
} from '@client/components/pages/report-detail/report-detail.types';

function buildReport(overrides: Partial<ReportDetailModel> = {}): ReportDetailModel {
  return {
    id: 'report-1',
    title: 'Phu Quoc trip',
    status: 'DRAFT',
    description: null,
    userId: 'user-1',
    items: [],
    totalAmount: 0,
    currency: 'USD',
    createdAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function buildItem(overrides = {}) {
  return {
    id: 'item-1',
    reportId: 'report-1',
    merchant: 'WeWork',
    description: 'Day pass',
    amount: 35,
    currency: 'USD',
    date: '2026-04-05',
    receiptUrl: null,
    receiptOriginalName: null,
    aiStatus: 'COMPLETED' as const,
    aiExtracted: false,
    createdAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    extractionError: null,
    ...overrides,
  };
}

function buildProps(
  overrides: Partial<ReportDetailOrganismProps> = {},
): ReportDetailOrganismProps {
  return {
    report: buildReport(),
    reportTitle: 'Phu Quoc trip',
    reportTitleError: null,
    isSavingTitle: false,
    canSubmitReport: false,
    titleIsDirty: false,
    isSubmitting: false,
    deletingItemId: null,
    onOpenDrawer: jest.fn(),
    onChooseReceipt: jest.fn(),
    onReportTitleChange: jest.fn(),
    onReportTitleCommit: jest.fn(),
    onReportTitleDiscard: jest.fn(),
    onSubmitReport: jest.fn(),
    onDeleteItem: jest.fn(),
    onReviewItem: jest.fn(),
    invalidItemCount: 0,
    ...overrides,
  };
}

describe('ReportDetailView delete action', () => {
  it('shows the trash action for draft items and calls the handler when clicked', () => {
    const onDeleteItem = jest.fn();

    render(
      <ReportDetailView
        {...buildProps({
          onDeleteItem,
          report: buildReport({ items: [buildItem()] }),
        })}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: /delete wework item/i });

    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('group-hover:bg-red-50');

    fireEvent.click(deleteButton);

    expect(onDeleteItem).toHaveBeenCalledWith('item-1');
  });

  it('hides the trash action when the report is not draft', () => {
    render(
      <ReportDetailView
        {...buildProps({
          report: buildReport({ status: 'SUBMITTED', items: [buildItem()] }),
        })}
      />,
    );

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('shows the loading state while a draft item is being deleted', () => {
    render(
      <ReportDetailView
        {...buildProps({
          deletingItemId: 'item-1',
          report: buildReport({ items: [buildItem()] }),
        })}
      />,
    );

    expect(screen.getByRole('button', { name: /delete wework item/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /delete wework item/i })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
