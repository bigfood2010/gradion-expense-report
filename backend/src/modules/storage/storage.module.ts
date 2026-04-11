import { Module } from '@nestjs/common';

import { InMemoryReceiptStorageService } from './in-memory-receipt-storage.service';
import { MinioReceiptStorageService } from './minio-receipt-storage.service';
import { RECEIPT_STORAGE } from './storage.tokens';

@Module({
  providers: [
    InMemoryReceiptStorageService,
    MinioReceiptStorageService,
    {
      provide: RECEIPT_STORAGE,
      inject: [InMemoryReceiptStorageService, MinioReceiptStorageService],
      useFactory: (
        inMemoryReceiptStorageService: InMemoryReceiptStorageService,
        minioReceiptStorageService: MinioReceiptStorageService,
      ) => {
        if (process.env.MINIO_ENDPOINT && process.env.NODE_ENV !== 'test') {
          return minioReceiptStorageService;
        }

        return inMemoryReceiptStorageService;
      },
    },
  ],
  exports: [RECEIPT_STORAGE],
})
export class StorageModule {}
