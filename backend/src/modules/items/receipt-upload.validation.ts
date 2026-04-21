import { BadRequestException } from '@nestjs/common';

import type { ReceiptUploadFile } from '@backend/modules/items/items.types';

export const MAX_RECEIPT_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'application/pdf',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]);

export function isAllowedReceiptMimeType(mimeType: string): boolean {
  return ALLOWED_RECEIPT_MIME_TYPES.has(mimeType.toLowerCase());
}

export function assertValidReceiptFile(file: ReceiptUploadFile): void {
  if (!isAllowedReceiptMimeType(file.mimetype)) {
    throw new BadRequestException('Receipt file type is not supported.');
  }

  if (file.size > MAX_RECEIPT_UPLOAD_BYTES) {
    throw new BadRequestException('Receipt file is too large.');
  }

  if (!hasExpectedContent(file)) {
    throw new BadRequestException('Receipt file content does not match its declared type.');
  }
}

function hasExpectedContent(file: ReceiptUploadFile): boolean {
  const mimeType = file.mimetype.toLowerCase();

  if (mimeType === 'text/plain') {
    return !file.buffer.includes(0);
  }

  if (mimeType === 'application/pdf') {
    return file.buffer.subarray(0, 4).toString('ascii') === '%PDF';
  }

  if (mimeType === 'image/png') {
    return file.buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  }

  if (mimeType === 'image/jpeg') {
    return file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  }

  if (mimeType === 'image/gif') {
    return file.buffer.subarray(0, 4).toString('ascii') === 'GIF8';
  }

  if (mimeType === 'image/webp') {
    return (
      file.buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      file.buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}
