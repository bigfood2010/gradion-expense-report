import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

import { ReceiptStorageRepository } from './receipt-storage.repository';
import { StoredReceipt, UploadReceiptInput } from './storage.types';
import { sanitizeFileName } from './storage.utils';

const PRESIGNED_URL_EXPIRY_SECONDS = 60 * 15;

@Injectable()
export class MinioReceiptStorageService extends ReceiptStorageRepository {
  private readonly bucketName = process.env.MINIO_BUCKET_NAME ?? 'receipts';
  private readonly client = new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
    accessKey: process.env.MINIO_ROOT_USER ?? 'gradion_minio',
    secretKey: process.env.MINIO_ROOT_PASSWORD ?? 'secure_minio_pass',
  });
  private bucketReadyPromise: Promise<void> | null = null;

  async uploadReceipt(input: UploadReceiptInput): Promise<StoredReceipt> {
    await this.ensureBucket();

    const objectKey = `reports/${input.reportId}/${randomUUID()}-${sanitizeFileName(input.originalName)}`;

    await this.client.putObject(this.bucketName, objectKey, input.buffer, input.size, {
      'Content-Type': input.mimeType,
      'X-Amz-Meta-Original-Name': input.originalName,
    });

    return {
      objectKey,
      size: input.size,
      mimeType: input.mimeType,
      originalName: input.originalName,
    };
  }

  async getReceiptUrl(objectKey: string): Promise<string> {
    return this.client.presignedGetObject(this.bucketName, objectKey, PRESIGNED_URL_EXPIRY_SECONDS);
  }

  async readReceipt(objectKey: string): Promise<Buffer> {
    await this.ensureBucket();

    const stream = await this.client.getObject(this.bucketName, objectKey);
    return readStream(stream);
  }

  async deleteReceipt(objectKey: string): Promise<void> {
    await this.ensureBucket();
    await this.client.removeObject(this.bucketName, objectKey);
  }

  private ensureBucket(): Promise<void> {
    if (!this.bucketReadyPromise) {
      this.bucketReadyPromise = this.initBucket().catch((error) => {
        this.bucketReadyPromise = null;
        throw error;
      });
    }
    return this.bucketReadyPromise;
  }

  private async initBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucketName);
    if (!exists) {
      await this.client.makeBucket(this.bucketName, 'us-east-1');
    }
  }
}

async function readStream(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
