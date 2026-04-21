import { TextEncoder } from 'util';
import type { ReportExpenseItem } from '@client/components/pages/report-detail/report-detail.types';

global.TextEncoder = TextEncoder as typeof global.TextEncoder;

const { countInvalidSubmitItems } = require('@client/routes/_authenticated/reports.$reportId');

function buildItem(overrides: Partial<ReportExpenseItem> = {}): ReportExpenseItem {
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
    aiStatus: 'COMPLETED',
    aiExtracted: true,
    createdAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-11T00:00:00.000Z').toISOString(),
    extractionError: null,
    ...overrides,
  };
}

describe('countInvalidSubmitItems', () => {
  it('counts items that are still processing extraction', () => {
    expect(
      countInvalidSubmitItems([
        buildItem({ aiStatus: 'PROCESSING', aiExtracted: false, amount: null }),
      ]),
    ).toBe(1);
  });

  it('counts extracted items that still need review', () => {
    expect(
      countInvalidSubmitItems([
        buildItem({ aiStatus: 'COMPLETED', aiExtracted: false, amount: null }),
      ]),
    ).toBe(1);
  });

  it('counts saved reviewed items with invalid amount', () => {
    expect(
      countInvalidSubmitItems([buildItem({ aiStatus: 'COMPLETED', aiExtracted: true, amount: 0 })]),
    ).toBe(1);
  });

  it('does not count valid saved items', () => {
    expect(
      countInvalidSubmitItems([
        buildItem({ aiStatus: 'COMPLETED', aiExtracted: true, amount: 12.5 }),
      ]),
    ).toBe(0);
  });
});
