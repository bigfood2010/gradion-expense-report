import type { PropsWithChildren, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@client/lib/motion';

export interface AuthTemplateProps {
  readonly title: string;
  readonly description: string;
  readonly footer?: ReactNode;
}

export function AuthTemplate({
  children,
  description,
  footer,
  title,
}: PropsWithChildren<AuthTemplateProps>) {
  return (
    <div className="auth-template">
      <motion.section
        initial="initial"
        animate="animate"
        exit="exit"
        variants={staggerContainer}
        className="auth-template__frame"
      >
        <motion.div
          variants={fadeInUp}
          className="-mb-2 inline-flex items-center gap-2.5 font-bold"
          style={{ color: 'rgb(255, 107, 0)' }}
        >
          <span
            className="h-3 w-3"
            style={{
              background: 'currentColor',
              clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
            }}
            aria-hidden="true"
          />
          <span className="text-[17px]">Gradion</span>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="rounded-[24px] border border-border bg-surface p-7 shadow-[0_18px_60px_rgba(0,0,0,0.04)]"
        >
          <div className="mb-7 flex flex-col gap-2">
            <h1 className="text-[30px] font-semibold leading-none tracking-[-0.05em] text-foreground sm:text-[36px]">
              {title}
            </h1>
            <p className="max-w-[30ch] text-[14px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {children}

          {footer && <div className="mt-6 border-t border-border pt-4">{footer}</div>}
        </motion.div>
      </motion.section>
    </div>
  );
}
