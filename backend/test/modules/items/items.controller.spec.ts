import { VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { ExpenseItemEntity } from '@backend/infrastructure/persistence/entities/expense-item.entity';
import { ExpenseReportEntity } from '@backend/infrastructure/persistence/entities/expense-report.entity';
import { JwtAuthGuard } from '@backend/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@backend/modules/auth/guards/roles.guard';
import { JwtStrategy } from '@backend/modules/auth/strategies/jwt.strategy';
import { InMemoryExpenseItemsRepository } from '@backend/modules/items/repositories/in-memory-expense-items.repository';
import { InMemoryReportStateRepository } from '@backend/modules/items/repositories/in-memory-report-state.repository';
import { TypeOrmExpenseItemsRepository } from '@backend/modules/items/repositories/typeorm-expense-items.repository';
import { TypeOrmReportStateRepository } from '@backend/modules/items/repositories/typeorm-report-state.repository';
import { ItemsModule } from '@backend/modules/items/items.module';
import { AI_STATUS, REPORT_STATUS } from '@backend/modules/items/items.types';
import { UserRole } from '@backend/modules/users/domain/user-role.enum';

const TEST_SECRET = 'test-jwt-secret-for-items-controller-spec';
const TEST_USER_ID = 'test-user-1';

describe('ItemsController', () => {
  let app: INestApplication;
  let reportStateRepository: InMemoryReportStateRepository;
  let expenseItemsRepository: InMemoryExpenseItemsRepository;
  let authToken: string;

  beforeEach(async () => {
    expenseItemsRepository = new InMemoryExpenseItemsRepository();
    reportStateRepository = new InMemoryReportStateRepository();

    const testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: TEST_SECRET, JWT_EXPIRES_IN: '1h', NODE_ENV: 'test' })],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_SECRET, signOptions: { expiresIn: '1h' } }),
        ItemsModule,
      ],
      providers: [
        JwtStrategy,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideProvider(DataSource)
      .useValue({ getRepository: jest.fn().mockReturnValue({}) })
      .overrideProvider(getRepositoryToken(ExpenseItemEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(ExpenseReportEntity))
      .useValue({})
      .overrideProvider(TypeOrmExpenseItemsRepository)
      .useValue(expenseItemsRepository)
      .overrideProvider(TypeOrmReportStateRepository)
      .useValue(reportStateRepository)
      .compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    const jwtService = testingModule.get(JwtService);
    authToken = await jwtService.signAsync({
      sub: TEST_USER_ID,
      email: 'test@example.com',
      role: UserRole.USER,
    });

    reportStateRepository.seed([
      { id: 'report-draft', userId: TEST_USER_ID, status: REPORT_STATUS.DRAFT },
      { id: 'report-submitted', userId: TEST_USER_ID, status: REPORT_STATUS.SUBMITTED },
      { id: 'report-rejected', userId: TEST_USER_ID, status: REPORT_STATUS.REJECTED },
      { id: 'report-approved', userId: TEST_USER_ID, status: REPORT_STATUS.APPROVED },
    ]);
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts receipt uploads and completes deterministic extraction asynchronously', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/v1/reports/report-draft/items')
      .set('Authorization', `Bearer ${authToken}`)
      .attach(
        'receipt',
        Buffer.from('merchant: Coffee House\namount: 12.34\ndate: 2026-04-10'),
        'coffee-house.txt',
      )
      .expect(202);

    expect(uploadResponse.body.item.aiStatus).toBe(AI_STATUS.PROCESSING);

    await waitFor(async () => {
      const stored = await expenseItemsRepository.findById(uploadResponse.body.item.id);
      expect(stored?.aiStatus).toBe(AI_STATUS.COMPLETED);
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/reports/report-draft/items')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: uploadResponse.body.item.id,
          aiStatus: AI_STATUS.COMPLETED,
          merchant: 'Coffee House',
          amount: '12.34',
          date: '2026-04-10',
        }),
      ]),
    );
    expect(listResponse.body.items[0].receiptUrl).toContain('report-draft');
  });

  it('rejects receipt uploads when the parent report is locked', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/reports/report-submitted/items')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('receipt', Buffer.from('merchant: Locked'), 'locked.txt')
      .expect(409);

    await expect(expenseItemsRepository.findByReportId('report-submitted')).resolves.toHaveLength(
      0,
    );
  });

  it('moves rejected reports back to draft on item mutation', async () => {
    const seededItem = await expenseItemsRepository.create({
      reportId: 'report-rejected',
      aiStatus: AI_STATUS.COMPLETED,
      amount: '8.25',
      merchant: 'Original Merchant',
      date: '2026-04-01',
      receiptObjectKey: 'receipts/report-rejected/original.txt',
      receiptMimeType: 'text/plain',
      receiptOriginalName: 'original.txt',
      receiptSize: 16,
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/items/${seededItem.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        merchant: 'Updated Merchant',
        amount: '19.50',
      })
      .expect(200);

    const report = await reportStateRepository.findById('report-rejected');
    const updatedItem = await expenseItemsRepository.findById(seededItem.id);

    expect(report?.status).toBe(REPORT_STATUS.DRAFT);
    expect(updatedItem?.merchant).toBe('Updated Merchant');
    expect(updatedItem?.amount).toBe('19.50');
  });

  it('preserves the item and rejects deletion when the report is approved', async () => {
    const seededItem = await expenseItemsRepository.create({
      reportId: 'report-approved',
      aiStatus: AI_STATUS.COMPLETED,
      amount: '14.00',
      merchant: 'Approved Merchant',
      date: '2026-04-02',
      receiptObjectKey: 'receipts/report-approved/original.txt',
      receiptMimeType: 'text/plain',
      receiptOriginalName: 'original.txt',
      receiptSize: 20,
    });

    await request(app.getHttpServer())
      .delete(`/api/v1/items/${seededItem.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(409);

    await expect(expenseItemsRepository.findById(seededItem.id)).resolves.not.toBeNull();
  });

  it('marks extraction as failed when the deterministic extractor is instructed to fail', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/v1/reports/report-draft/items')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('receipt', Buffer.from('fail-extraction'), 'fail-extraction.txt')
      .expect(202);

    await waitFor(async () => {
      const stored = await expenseItemsRepository.findById(uploadResponse.body.item.id);
      expect(stored?.aiStatus).toBe(AI_STATUS.FAILED);
      expect(stored?.extractionError).toBe('Deterministic extraction failure requested');
    });
  });
});

async function waitFor(assertion: () => Promise<void>, timeoutMs = 1_500): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await assertion();
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  await assertion();
}
