import { parseReceiptText } from '@backend/modules/ai/receipt-text-parser';

describe('parseReceiptText', () => {
  it('extracts merchant, grand total, date, and currency from OCR-style marketplace receipt text', () => {
    const result = parseReceiptText(
      `
      TikTok Shop
      Order Receipt

      Sold By
      AOAHOUSE

      Order Details
      Order Date : April 4, 2026 14:08

      Grand total (includes VAT)
      377.6500đ
      `,
      'IMG_6475.png',
    );

    expect(result).toEqual({
      merchant: 'TikTok Shop / AOAHOUSE',
      amount: '377650.00',
      currency: 'VND',
      date: '2026-04-04',
      description: null,
    });
  });

  it('extracts brand plus branch, final paid total, and transaction date from OCR-style store receipts', () => {
    const result = parseReceiptText(
      `
      i
      Riverside Retail Park
      Phone: 0161 250 6307
      STORE # 63225
      VAT No: 273 5224 09
      1002 Olivia
      Chk 2639
      1 Venti Mocha Latte $13,90
      Oat Milk $0,50
      1 Chocolate Pie $8
      1 Gr Wht Mocha $11.90
      Oat Milk $0,50
      Subtotal $34.8
      Tax $3,22
      Total $38.02
      5/25/2025, 3:48:03 PM
      Thank you for visiting Starbucks
      `,
      'receipt.png',
    );

    expect(result).toEqual({
      merchant: 'Starbucks / Riverside Retail Park',
      amount: '38.02',
      currency: 'USD',
      date: '2025-05-25',
      description: null,
    });
  });

  it('falls back to labeled values from plain-text receipts', () => {
    const result = parseReceiptText(
      `
      merchant: Coffee House
      amount: 12.34
      currency: usd
      date: 2026-04-10
      `,
      'coffee-house.txt',
    );

    expect(result).toEqual({
      merchant: 'Coffee House',
      amount: '12.34',
      currency: 'USD',
      date: '2026-04-10',
      description: null,
    });
  });
});
