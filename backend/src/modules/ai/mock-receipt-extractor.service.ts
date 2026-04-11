import { Injectable } from '@nestjs/common';

import {
  ReceiptExtractionInput,
  ReceiptExtractorRepository,
} from './receipt-extractor.repository';
import { parseReceiptText } from './receipt-text-parser';

@Injectable()
export class MockReceiptExtractorService extends ReceiptExtractorRepository {
  async extract(input: ReceiptExtractionInput) {
    const text = await readReceiptText(input);
    const failRequested =
      /fail-extraction/i.test(text) || /fail-extraction/i.test(input.originalName);

    if (failRequested) {
      throw new Error('Deterministic extraction failure requested');
    }

    return parseReceiptText(text, input.originalName);
  }
}

async function readReceiptText(input: ReceiptExtractionInput): Promise<string> {
  if (input.mimeType.startsWith('image/')) {
    return readImageText(input.buffer);
  }

  return input.buffer.toString('utf-8');
}

async function readImageText(buffer: Buffer): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');

  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);

    return text;
  } finally {
    await worker.terminate();
  }
}
