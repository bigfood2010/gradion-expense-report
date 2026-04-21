import { act, render, waitFor } from '@testing-library/react';

import type {
  ReceiptDraft,
  ReportDetailPageProps,
  ReportExpenseItem,
} from '@client/components/pages/report-detail/report-detail.types';
import { ReportDetailRoute } from '@client/routes/_authenticated/reports.$reportId';
import { useAuthSession } from '@client/lib/hooks';

const navigateMock = jest.fn();
const queryClient = {
  invalidateQueries: jest.fn(),
};

const updateReportMutation = {
  isPending: false,
  mutateAsync: jest.fn(),
};

const uploadReceiptMutation = {
  isPending: false,
  mutateAsync: jest.fn(async () => ({ item: { id: 'item-1' } })),
};

const updateItemMutation = {
  isPending: false,
  mutateAsync: jest.fn(),
};

const deleteItemMutation = {
  isPending: false,
  mutateAsync: jest.fn(),
};

const submitReportMutation = {
  isPending: false,
  mutateAsync: jest.fn(),
};

const reportQueryData = {
  id: 'report-1',
  title: 'Trip to Da Nang',
  status: 'DRAFT',
  description: null,
  userId: 'user-1',
  totalAmount: 0,
  currency: 'USD',
  createdAt: new Date('2026-04-20T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-04-20T00:00:00.000Z').toISOString(),
};

const completedItem: ReportExpenseItem = {
  id: 'item-1',
  reportId: 'report-1',
  merchant: 'Starbucks / Riverside Retail Park',
  description: 'Coffee',
  amount: 38.02,
  currency: 'USD',
  date: '2026-05-25',
  receiptUrl: 'https://example.com/receipt.png',
  receiptOriginalName: 'receipt.png',
  aiStatus: 'COMPLETED',
  aiExtracted: false,
  createdAt: new Date('2026-04-21T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-04-21T00:00:00.000Z').toISOString(),
  extractionError: null,
};

const itemsQueryData = {
  items: [completedItem],
};

let capturedProps: ReportDetailPageProps | undefined;

jest.mock('@tanstack/react-router', () => {
  const React = require('react');
  const useParams = jest.fn(() => ({ reportId: 'report-1' }));

  return {
    createFileRoute: jest.fn(() => () => ({ useParams })),
    Navigate: ({ to }: { to: string }) =>
      React.createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
    useBlocker: jest.fn(),
    useNavigate: jest.fn(() => navigateMock),
  };
});

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => updateReportMutation),
  useQueryClient: jest.fn(() => queryClient),
}));

jest.mock('@client/lib/hooks', () => ({
  useAuthSession: jest.fn(),
  useDeleteExpenseItemMutation: jest.fn(() => deleteItemMutation),
  useExpenseReportDetailQuery: jest.fn(() => ({ data: reportQueryData, isLoading: false })),
  useExpenseReportItemsQuery: jest.fn(() => ({ data: itemsQueryData })),
  useSubmitExpenseReportMutation: jest.fn(() => submitReportMutation),
  useUpdateExpenseItemMutation: jest.fn(() => updateItemMutation),
  useUploadExpenseItemMutation: jest.fn(() => uploadReceiptMutation),
}));

jest.mock('@client/components/pages/report-detail/report-detail-page', () => {
  const React = require('react');

  return {
    ReportDetailPage: (props: ReportDetailPageProps) => {
      capturedProps = props;
      return React.createElement('div', { 'data-testid': 'report-detail-page' });
    },
  };
});

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

const useAuthSessionMock = useAuthSession as jest.Mock;

function buildDraftForAssert(): ReceiptDraft {
  return {
    merchant: completedItem.merchant ?? '',
    description: completedItem.description ?? '',
    amount: '38.02',
    currency: 'USD',
    date: '2026-05-25',
    receiptUrl: completedItem.receiptUrl ?? null,
    aiExtractedFields: {
      merchant: true,
      description: true,
      amount: true,
      currency: true,
      date: true,
    },
  };
}

describe('ReportDetailRoute receipt prefill', () => {
  beforeEach(() => {
    capturedProps = undefined;
    jest.clearAllMocks();

    useAuthSessionMock.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'vinh@example.com',
        name: 'Vinh',
        role: 'user',
      },
      signOut: jest.fn(),
    } as any);
  });

  it('prefills extracted receipt values and keeps review unsaved until explicit save', async () => {
    render(<ReportDetailRoute />);

    expect(capturedProps).toBeDefined();

    await act(async () => {
      await capturedProps!.onChooseReceipt(
        new File(['receipt'], 'receipt.png', { type: 'image/png' }),
      );
    });

    await waitFor(() => {
      expect(capturedProps?.drawer.step).toBe('review');
    });

    expect(capturedProps?.draft).toMatchObject(buildDraftForAssert());
    expect(capturedProps?.savedDraft).toBeUndefined();
    expect(updateItemMutation.mutateAsync).not.toHaveBeenCalled();

    await act(async () => {
      await capturedProps!.onSaveReceipt();
    });

    expect(updateItemMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(updateItemMutation.mutateAsync).toHaveBeenCalledWith({
      itemId: 'item-1',
      payload: {
        merchant: 'Starbucks / Riverside Retail Park',
        description: 'Coffee',
        amount: '38.02',
        currency: 'USD',
        date: '2026-05-25',
        aiExtracted: true,
      },
    });
  });
});
