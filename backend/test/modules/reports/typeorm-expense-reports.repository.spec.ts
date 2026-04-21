import type { Repository } from 'typeorm';

import { ExpenseReportEntity } from '@backend/modules/reports/entities/expense-report.entity';
import { TypeOrmExpenseReportsRepository } from '@backend/modules/reports/repository/typeorm-expense-reports.repository';
import { ExpenseReportStatus } from '@backend/modules/reports/reports.types';

class QueryBuilderMock {
  readonly addOrderBy = jest.fn().mockReturnThis();
  readonly andWhere = jest.fn().mockReturnThis();
  readonly getMany = jest.fn();
  readonly getOne = jest.fn();
  readonly leftJoinAndSelect = jest.fn().mockReturnThis();
  readonly orderBy = jest.fn().mockReturnThis();
  readonly select = jest.fn().mockReturnThis();
  readonly take = jest.fn().mockReturnThis();
  readonly where = jest.fn().mockReturnThis();
}

describe('TypeOrmExpenseReportsRepository', () => {
  it('scopes cursor pagination by owner and status with a stable tie breaker', async () => {
    const listQueryBuilder = new QueryBuilderMock();
    const cursorQueryBuilder = new QueryBuilderMock();
    const cursorCreatedAt = new Date('2026-04-10T00:00:00.000Z');
    listQueryBuilder.getMany.mockResolvedValue([{ id: 'report-2' }, { id: 'report-1' }]);
    cursorQueryBuilder.getOne.mockResolvedValue({
      id: 'cursor-report',
      createdAt: cursorCreatedAt,
    });
    const repository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(listQueryBuilder)
        .mockReturnValueOnce(cursorQueryBuilder),
    } as unknown as Repository<ExpenseReportEntity>;
    const reportsRepository = new TypeOrmExpenseReportsRepository(repository);

    const result = await reportsRepository.listWithCursor({
      cursor: 'cursor-report',
      limit: 1,
      ownerId: 'owner-1',
      status: ExpenseReportStatus.SUBMITTED,
    });

    expect(cursorQueryBuilder.where).toHaveBeenCalledWith('report.id = :cursor', {
      cursor: 'cursor-report',
    });
    expect(cursorQueryBuilder.andWhere).toHaveBeenCalledWith('report.userId = :ownerId', {
      ownerId: 'owner-1',
    });
    expect(cursorQueryBuilder.andWhere).toHaveBeenCalledWith('report.status = :status', {
      status: ExpenseReportStatus.SUBMITTED,
    });
    expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('report.createdAt < :cursorCreatedAt'),
      {
        cursorCreatedAt,
        cursorId: 'cursor-report',
      },
    );
    expect(listQueryBuilder.addOrderBy).toHaveBeenCalledWith('report.id', 'DESC');
    expect(result).toEqual({
      hasMore: true,
      items: [{ id: 'report-2' }],
      nextCursor: 'report-2',
    });
  });
});
