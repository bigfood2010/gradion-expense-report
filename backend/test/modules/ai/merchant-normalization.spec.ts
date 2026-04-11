import { normalizeExtractedMerchant } from '@backend/modules/ai/merchant-normalization';

describe('normalizeExtractedMerchant', () => {
  it.each([
    ['IMG 6475.PNG', 'IMG_6475.png'],
    ['IMG 6475', 'IMG_6475.png'],
    ['receipt', 'receipt.png'],
    ['receipt.png', 'receipt.png'],
    ['image', 'image.jpg'],
  ])('rejects filename-like merchant %p', (merchant, originalName) => {
    expect(normalizeExtractedMerchant(merchant, originalName)).toBe('');
  });

  it('keeps a valid merchant name', () => {
    expect(normalizeExtractedMerchant('TikTok Shop / AOAHOUSE', 'IMG_6475.png')).toBe(
      'TikTok Shop / AOAHOUSE',
    );
  });
});
