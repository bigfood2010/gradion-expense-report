import type { ReactNode } from 'react';
import { cn } from '@client/lib/cn';

export interface DataTableColumn<TItem> {
  readonly id: string;
  readonly header: ReactNode;
  readonly cell: (item: TItem) => ReactNode;
  readonly align?: 'left' | 'right';
  readonly className?: string;
}

export interface DataTableProps<TItem> {
  readonly columns: readonly DataTableColumn<TItem>[];
  readonly items: readonly TItem[];
  readonly getRowKey: (item: TItem) => string;
  readonly emptyState?: ReactNode;
  readonly className?: string;
}

export function DataTable<TItem>({
  className,
  columns,
  emptyState,
  getRowKey,
  items,
}: DataTableProps<TItem>) {
  if (items.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className={cn('data-table surface', className)}>
      <table className="data-table__table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  'data-table__head',
                  column.align === 'right' && 'data-table__cell--numeric',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getRowKey(item)} className="data-table__row">
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    'data-table__cell',
                    column.align === 'right' && 'data-table__cell--numeric',
                    column.className,
                  )}
                >
                  {column.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
