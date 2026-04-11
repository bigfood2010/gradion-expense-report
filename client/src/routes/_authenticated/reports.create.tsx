import { type FormEvent, type ReactElement, useRef, useState } from 'react';
import { Navigate, createFileRoute, useBlocker, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/components/atoms/button';
import { Input } from '@client/components/atoms/input';
import { LeaveConfirmDialog } from '@client/components/organisms/common/leave-confirm-dialog';
import { WorkspaceTemplate } from '@client/components/templates/workspace-template';
import { useAuthSession, useCreateExpenseReportMutation } from '@client/lib/hooks';

export const Route = createFileRoute('/_authenticated/reports/create' as any)({
  component: CreateReportRoute,
});

const DEFAULT_TITLE = 'Untitled Report';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function CreateReportRoute(): ReactElement {
  const navigate = useNavigate();
  const { signOut, user } = useAuthSession();
  const createReportMutation = useCreateExpenseReportMutation();
  const [reportTitle, setReportTitle] = useState(DEFAULT_TITLE);
  const [reportTitleError, setReportTitleError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const leaveConfirmResolveRef = useRef<((shouldStay: boolean) => void) | null>(null);
  const leaveConfirmPromiseRef = useRef<Promise<boolean> | null>(null);
  const skipLeaveBlockRef = useRef(false);

  const hasUnsavedChanges = reportTitle.trim() !== DEFAULT_TITLE.trim();
  const isSubmitting = createReportMutation.isPending;

  const confirmLeave = () => {
    if (leaveConfirmPromiseRef.current) {
      return leaveConfirmPromiseRef.current;
    }

    const promise = new Promise<boolean>((resolve) => {
      leaveConfirmResolveRef.current = resolve;
      setLeaveConfirmOpen(true);
    });

    leaveConfirmPromiseRef.current = promise;
    return promise;
  };

  const cancelLeaveConfirm = () => {
    leaveConfirmResolveRef.current?.(true);
    leaveConfirmResolveRef.current = null;
    leaveConfirmPromiseRef.current = null;
    setLeaveConfirmOpen(false);
  };

  const confirmLeaveConfirm = () => {
    leaveConfirmResolveRef.current?.(false);
    leaveConfirmResolveRef.current = null;
    leaveConfirmPromiseRef.current = null;
    setLeaveConfirmOpen(false);
  };

  useBlocker({
    enableBeforeUnload: hasUnsavedChanges,
    shouldBlockFn: () => {
      if (!hasUnsavedChanges || skipLeaveBlockRef.current) {
        return false;
      }

      return confirmLeave();
    },
  });

  if (user?.role === 'admin') {
    return <Navigate to={'/admin' as any} />;
  }

  const handleBack = async () => {
    await navigate({ to: '/' as any });
  };

  const handleSignOut = async () => {
    if (hasUnsavedChanges) {
      const shouldStay = await confirmLeave();
      if (shouldStay) {
        return;
      }
    }

    skipLeaveBlockRef.current = true;
    try {
      await signOut();
    } finally {
      skipLeaveBlockRef.current = false;
    }
  };

  const handleTitleChange = (value: string) => {
    setReportTitle(value);
    if (value.trim()) {
      setReportTitleError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextTitle = reportTitle.trim();
    if (!nextTitle) {
      setReportTitleError('Report title is required.');
      return;
    }

    try {
      setReportTitleError(null);
      const report = await createReportMutation.mutateAsync({
        payload: {
          title: nextTitle,
          description: null,
        },
      });

      skipLeaveBlockRef.current = true;
      try {
        await navigate({
          to: '/reports/$reportId' as any,
          params: { reportId: report.id } as any,
          replace: true,
        });
      } finally {
        skipLeaveBlockRef.current = false;
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create the report.'), {
        id: 'report-create',
      });
    }
  };

  const leftAction = (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-[14px] text-muted-foreground/60 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => void handleBack()}
      disabled={isSubmitting}
    >
      <ArrowLeft size={16} strokeWidth={1.2} />
      Back
    </button>
  );

  const actions = (
    <div className="flex items-center gap-5">
      <p className="hidden cursor-default select-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground/40 sm:block">
        {user?.name ?? user?.email ?? 'Account'}
      </p>
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground transition-colors duration-200 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => void handleSignOut()}
        disabled={isSubmitting}
      >
        Sign Out
      </button>
    </div>
  );

  return (
    <WorkspaceTemplate title="Create report" leftAction={leftAction} actions={actions} wide>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-8">
          <div className="space-y-2">
            <label
              htmlFor="report-title"
              className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60"
            >
              Title
            </label>
            <Input
              id="report-title"
              autoComplete="off"
              autoFocus
              maxLength={160}
              placeholder={DEFAULT_TITLE}
              value={reportTitle}
              disabled={isSubmitting}
              onChange={(event) => handleTitleChange(event.target.value)}
              onBlur={() => {
                if (!reportTitle.trim()) {
                  setReportTitleError('Report title is required.');
                }
              }}
              onFocus={(event) => {
                event.currentTarget.select();
              }}
              aria-invalid={Boolean(reportTitleError)}
              aria-describedby={reportTitleError ? 'report-title-error' : 'report-title-help'}
            />
            {reportTitleError && (
              <p id="report-title-error" className="text-[13px] text-red-600">
                {reportTitleError}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-black/[0.04] pt-6 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-[13px] text-muted-foreground/60">
            {isSubmitting && 'Creating report...'}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="secondary" disabled={isSubmitting} onClick={() => void handleBack()}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create report
            </Button>
          </div>
        </div>
      </form>

      <LeaveConfirmDialog
        open={leaveConfirmOpen}
        title="Leave create report?"
        description="Unsaved changes will be discarded if you leave now."
        cancelLabel="Stay on page"
        confirmLabel="Discard draft"
        onCancel={cancelLeaveConfirm}
        onConfirm={confirmLeaveConfirm}
      />
    </WorkspaceTemplate>
  );
}
