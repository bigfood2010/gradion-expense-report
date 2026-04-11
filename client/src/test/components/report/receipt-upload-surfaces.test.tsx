import { fireEvent, render, screen } from '@testing-library/react';

import { ReportDetailView } from '@client/components/organisms/report/report-detail-view';
import { ReportReceiptDrawer } from '@client/components/organisms/report/report-receipt-drawer';
import type {
  ReceiptDrawerState,
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

function buildDetailViewProps(
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
    invalidItemCount: 0,
    onReviewItem: jest.fn(),
    ...overrides,
  };
}

function buildDrawer(overrides: Partial<ReceiptDrawerState> = {}): ReceiptDrawerState {
  return {
    open: true,
    step: 'upload',
    fileName: null,
    pendingItemId: null,
    error: null,
    ...overrides,
  };
}

describe('receipt upload surfaces', () => {
  it('opens the report file picker when the visible upload tile is clicked', () => {
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    render(<ReportDetailView {...buildDetailViewProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /drag a receipt here or click to upload/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it('passes a dropped file from the drawer upload panel to the chooser handler', () => {
    const onChooseReceipt = jest.fn();
    const file = new File(['receipt'], 'receipt.png', { type: 'image/png' });

    render(
      <ReportReceiptDrawer
        draft={{
          merchant: '',
          description: '',
          amount: '',
          currency: 'USD',
          date: '',
          receiptUrl: null,
          aiExtractedFields: {},
        }}
        drawer={buildDrawer()}
        isSavingReceipt={false}
        isUploadingReceipt={false}
        onChooseReceipt={onChooseReceipt}
        onClose={jest.fn()}
        onDraftChange={jest.fn()}
        onRetryUpload={jest.fn()}
        onSave={jest.fn()}
        reportStatus="DRAFT"
      />,
    );

    fireEvent.drop(screen.getByRole('button', { name: /upload a receipt/i }), {
      dataTransfer: { files: [file] },
    });

    expect(onChooseReceipt).toHaveBeenCalledWith(file);
  });
});
