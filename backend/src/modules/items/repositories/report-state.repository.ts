import { ReportStateRecord } from '@backend/modules/items/items.types';

export abstract class ReportStateRepository {
  abstract findById(reportId: string): Promise<ReportStateRecord | null>;

  abstract save(report: ReportStateRecord): Promise<ReportStateRecord>;
}
