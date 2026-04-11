import { Injectable } from '@nestjs/common';

import { ReportStateRecord } from '@backend/modules/items/items.types';
import { ReportStateRepository } from '@backend/modules/items/repositories/report-state.repository';

@Injectable()
export class InMemoryReportStateRepository extends ReportStateRepository {
  private readonly reports = new Map<string, ReportStateRecord>();

  seed(reports: ReportStateRecord[]): void {
    this.reports.clear();

    for (const report of reports) {
      this.reports.set(report.id, { ...report });
    }
  }

  async findById(reportId: string): Promise<ReportStateRecord | null> {
    const report = this.reports.get(reportId);
    return report ? { ...report } : null;
  }

  async save(report: ReportStateRecord): Promise<ReportStateRecord> {
    this.reports.set(report.id, { ...report });
    return { ...report };
  }
}
