import type { PropsWithChildren, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { cn } from '@client/lib/cn';
import { SectionHeader } from '@client/components/molecules/section-header';
import { fadeInUp } from '@client/lib/motion';

export interface WorkspaceTemplateProps {
  readonly title: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
  readonly leftAction?: ReactNode;
  readonly summary?: ReactNode;
  readonly summaryColumns?: 1 | 2 | 3 | 5;
  readonly wide?: boolean;
  readonly showHeader?: boolean;
}

export function WorkspaceTemplate({
  actions,
  children,
  description,
  eyebrow,
  leftAction,
  summary,
  summaryColumns = 5,
  title,
  wide = false,
  showHeader = true,
}: PropsWithChildren<WorkspaceTemplateProps>) {
  return (
    <div className="min-h-screen bg-[--background]">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-black/[0.04] bg-white/80 px-4 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-4">
          {leftAction ? (
            leftAction
          ) : (
            <Link
              to={'/' as any}
              aria-label="Go to home"
              className="inline-flex select-none items-center gap-2.5 font-bold"
              style={{ color: 'rgb(255, 107, 0)' }}
            >
              <span
                className="h-2.5 w-2.5"
                style={{
                  background: 'currentColor',
                  clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                }}
                aria-hidden="true"
              />
              <span className="text-[15px]">Gradion</span>
            </Link>
          )}
        </div>
        {actions ? <div className="flex items-center gap-6">{actions}</div> : null}
      </header>

      <motion.section
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeInUp}
        className="workspace-template mx-auto mt-10 w-full max-w-5xl px-4 pb-20 sm:mt-14 sm:px-6 lg:px-8"
      >
        {showHeader && <SectionHeader description={description} eyebrow={eyebrow} title={title} />}
        {summary ? (
          <div
            className={cn(
              'workspace-template__summary',
              `workspace-template__summary--columns-${summaryColumns}`,
            )}
          >
            {summary}
          </div>
        ) : null}
        <div className={cn('workspace-template__body', wide && 'workspace-template__body--wide')}>
          {children}
        </div>
      </motion.section>
    </div>
  );
}
