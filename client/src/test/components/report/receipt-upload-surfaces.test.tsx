import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ReportDetailView } from '@client/components/organisms/report/report-detail-view';
import { ReportReceiptDrawer } from '@client/components/organisms/report/report-receipt-drawer';
import type {
  ReceiptDraft,
  ReceiptDrawerState,
  ReportDetailOrganismProps,
  ReportDetailView as ReportDetailModel,
  ReportExpenseItem,
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

function buildDraft(overrides: Partial<ReceiptDraft> = {}): ReceiptDraft {
  return {
    merchant: '',
    description: '',
    amount: '',
    currency: 'USD',
    date: '',
    receiptUrl: null,
    aiExtractedFields: {},
    ...overrides,
  };
}

function buildItem(overrides: Partial<ReportExpenseItem> = {}): ReportExpenseItem {
  return {
    id: 'item-1',
    reportId: 'report-1',
    merchant: 'NEW BALANCE',
    description: 'No description',
    amount: 0,
    currency: 'USD',
    date: '2025-03-05',
    receiptUrl: null,
    receiptOriginalName: 'receipt.png',
    aiStatus: 'COMPLETED',
    aiExtracted: true,
    createdAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    extractionError: null,
    ...overrides,
  };
}

function buildDraftFromItem(item: ReportExpenseItem): ReceiptDraft {
  return {
    merchant: item.merchant ?? '',
    description: item.description ?? '',
    amount: typeof item.amount === 'number' ? item.amount.toFixed(2) : String(item.amount ?? ''),
    currency: item.currency ?? 'USD',
    date: item.date ?? '',
    receiptUrl: item.receiptUrl,
    aiExtractedFields: {
      merchant: true,
      description: true,
      amount: true,
      currency: true,
      date: true,
    },
  };
}

function ControlledReceiptDrawer({
  initialDraft = buildDraft(),
  initialSavedDraft,
  onSave = jest.fn(),
}: {
  initialDraft?: ReceiptDraft;
  initialSavedDraft?: ReceiptDraft;
  onSave?: jest.Mock;
}) {
  const [draft, setDraft] = useState(initialDraft);

  return (
    <ReportReceiptDrawer
      draft={draft}
      drawer={buildDrawer({ step: 'review' })}
      initialDraft={initialSavedDraft}
      isSavingReceipt={false}
      isUploadingReceipt={false}
      onChooseReceipt={jest.fn()}
      onClose={jest.fn()}
      onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
      onRetryUpload={jest.fn()}
      onSave={onSave}
      reportStatus="DRAFT"
    />
  );
}

function ControlledReviewSurface({
  item = buildItem(),
  onSave = jest.fn(),
}: {
  item?: ReportExpenseItem;
  onSave?: jest.Mock;
}) {
  const [draft, setDraft] = useState(buildDraft());
  const [savedDraft, setSavedDraft] = useState<ReceiptDraft | undefined>(undefined);
  const [drawer, setDrawer] = useState(buildDrawer({ open: false }));

  const report = buildReport({ items: [item] });

  return (
    <>
      <ReportDetailView
        {...buildDetailViewProps({
          report,
          onReviewItem: (reviewItem) => {
            const nextDraft = buildDraftFromItem(reviewItem);
            setDraft(nextDraft);
            setSavedDraft(nextDraft);
            setDrawer({
              open: true,
              step: 'review',
              fileName: reviewItem.receiptOriginalName ?? reviewItem.id,
              pendingItemId: reviewItem.id,
              error: null,
            });
          },
        })}
      />
      <ReportReceiptDrawer
        draft={draft}
        drawer={drawer}
        initialDraft={savedDraft}
        isSavingReceipt={false}
        isUploadingReceipt={false}
        onChooseReceipt={jest.fn()}
        onClose={jest.fn()}
        onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        onRetryUpload={jest.fn()}
        onSave={onSave}
        pendingItemStatus={item.aiStatus}
        reportStatus="DRAFT"
      />
    </>
  );
}

describe('receipt upload surfaces', () => {
  it('opens the report file picker when the visible upload tile is clicked', () => {
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    render(<ReportDetailView {...buildDetailViewProps()} />);

    fireEvent.click(
      screen.getByRole('button', { name: /drag a receipt here or click to upload/i }),
    );

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

  it('shows inline required errors and blocks save item when review fields are blank', () => {
    const onSave = jest.fn();

    render(<ControlledReceiptDrawer onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /save item/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getAllByText('This field is required.')).toHaveLength(3);
    expect(screen.getByLabelText(/merchant/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/amount/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/date/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/currency/i)).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows inline required errors and blocks update item when edit fields are blank', () => {
    const onSave = jest.fn();

    render(
      <ControlledReceiptDrawer
        initialDraft={buildDraft({
          merchant: '',
          amount: '18.50',
          currency: 'USD',
          date: '2026-04-18',
        })}
        initialSavedDraft={buildDraft({
          merchant: 'Cafe',
          amount: '18.50',
          currency: 'USD',
          date: '2026-04-18',
        })}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /update item/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
    expect(screen.getByLabelText(/merchant/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears only the edited field error after validation', () => {
    render(<ControlledReceiptDrawer />);

    fireEvent.click(screen.getByRole('button', { name: /save item/i }));
    fireEvent.change(screen.getByLabelText(/merchant/i), { target: { value: 'Cafe' } });

    expect(screen.getAllByText('This field is required.')).toHaveLength(2);
    expect(screen.getByLabelText(/merchant/i)).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByLabelText(/amount/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/date/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an enabled save action for prefilled review drafts and submits on click', () => {
    const onSave = jest.fn();

    render(
      <ControlledReceiptDrawer
        initialDraft={buildDraft({
          merchant: 'Cafe',
          amount: '18.50',
          currency: 'USD',
          date: '2026-04-18',
        })}
        onSave={onSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save item/i });

    expect(saveButton).toBeEnabled();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('This field is required.')).not.toBeInTheDocument();
  });

  it('opens the review drawer from the edit icon and keeps save explicit', () => {
    const onSave = jest.fn();
    const item = buildItem();

    render(<ControlledReviewSurface item={item} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /edit NEW BALANCE item/i }));

    expect(screen.getByText('Review Extracted Item')).toBeInTheDocument();
    expect(screen.getByLabelText(/merchant/i)).toHaveValue('NEW BALANCE');
    expect(screen.getByLabelText(/amount/i)).toHaveValue(0);
    expect(screen.getByLabelText(/date/i)).toHaveValue('2025-03-05');
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '12.50' } });
    fireEvent.click(screen.getByRole('button', { name: /update item/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
