import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { useRef } from 'react';

import type { ReportLeaveConfirmDialogProps } from '../../pages/report-detail/report-detail.types';

export function ReportLeaveConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: ReportLeaveConfirmDialogProps) {
  const closeIntentRef = useRef<'cancel' | 'confirm' | null>(null);

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          return;
        }

        if (closeIntentRef.current) {
          closeIntentRef.current = null;
          return;
        }

        onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[--border] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)] outline-none">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[--foreground]">
              <AlertTriangle aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 space-y-2">
              <AlertDialog.Title className="text-[20px] font-medium tracking-[-0.02em] text-[--foreground]">
                Leave this report?
              </AlertDialog.Title>
              <AlertDialog.Description className="text-[14px] leading-6 text-[--muted-foreground]">
                Unsaved title edits, receipt uploads, and item changes will be discarded if you
                leave now.
              </AlertDialog.Description>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[--border] bg-white px-4 text-[14px] font-medium text-[--foreground] transition-[background-color,border-color] duration-150 hover:bg-black/[0.02]"
                onClick={() => {
                  closeIntentRef.current = 'cancel';
                  onCancel();
                }}
              >
                Stay on page
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-600 px-4 text-[14px] font-medium text-white transition-[background-color,opacity] duration-150 hover:bg-red-700"
                onClick={() => {
                  closeIntentRef.current = 'confirm';
                  onConfirm();
                }}
              >
                Discard changes
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
