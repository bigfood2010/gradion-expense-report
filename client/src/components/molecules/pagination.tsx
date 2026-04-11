import { type ReactElement } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { PaginationMetaDto } from '@gradion/shared/common';
import { cn } from '@client/lib/cn';

type PaginationToken = number | 'ellipsis';

export interface PaginationProps {
  readonly meta?: PaginationMetaDto | null;
  readonly onPageChange: (page: number) => void;
  readonly className?: string;
}

function buildPaginationTokens(page: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PaginationToken[] = [1];
  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(totalPages - 1, page + 1);

  if (windowStart > 2) {
    tokens.push('ellipsis');
  }

  for (let current = windowStart; current <= windowEnd; current += 1) {
    tokens.push(current);
  }

  if (windowEnd < totalPages - 1) {
    tokens.push('ellipsis');
  }

  tokens.push(totalPages);
  return tokens;
}

export function Pagination({
  className,
  meta,
  onPageChange,
}: PaginationProps): ReactElement | null {
  if (!meta || meta.totalItems === 0 || meta.totalPages <= 1) {
    return null;
  }

  const startItem = (meta.page - 1) * meta.pageSize + 1;
  const endItem = Math.min(meta.page * meta.pageSize, meta.totalItems);
  const tokens = buildPaginationTokens(meta.page, meta.totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between px-4 py-3', className)}
    >
      <p className="text-[13px] font-semibold text-foreground/50">
        {startItem}–{endItem} of {meta.totalItems}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={!meta.hasPreviousPage}
          onClick={() => {
            if (meta.hasPreviousPage) {
              onPageChange(meta.page - 1);
            }
          }}
          className={cn(
            'size-9 rounded-[4px] inline-flex items-center justify-center transition-colors',
            meta.hasPreviousPage
              ? 'text-foreground/70 hover:bg-black/5 hover:text-foreground'
              : 'opacity-30 cursor-not-allowed',
          )}
        >
          <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2} />
        </button>

        {tokens.map((token, index) =>
          token === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="size-9 inline-flex items-center justify-center text-[13px] font-semibold text-foreground/30"
            >
              …
            </span>
          ) : (
            <button
              key={token}
              type="button"
              aria-label={`Go to page ${token}`}
              aria-current={token === meta.page ? 'page' : undefined}
              onClick={() => {
                if (token !== meta.page) {
                  onPageChange(token);
                }
              }}
              className={cn(
                'size-9 rounded-[4px] inline-flex items-center justify-center text-[13px] transition-colors',
                token === meta.page
                  ? 'bg-black text-white font-bold shadow-sm'
                  : 'font-semibold text-foreground/60 hover:bg-black/5 hover:text-foreground',
              )}
            >
              {token}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={!meta.hasNextPage}
          onClick={() => {
            if (meta.hasNextPage) {
              onPageChange(meta.page + 1);
            }
          }}
          className={cn(
            'size-9 rounded-[4px] inline-flex items-center justify-center transition-colors',
            meta.hasNextPage
              ? 'text-foreground/70 hover:bg-black/5 hover:text-foreground'
              : 'opacity-30 cursor-not-allowed',
          )}
        >
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}
