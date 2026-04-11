import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, FileText } from 'lucide-react';
import { cn } from '@client/lib/cn';

type MetricVisual = 'pulse' | 'bars' | 'scan';

export interface MetricCardProps {
  readonly eyebrow: string;
  readonly value: ReactNode;
  readonly description: string;
  readonly visual?: MetricVisual;
  readonly className?: string;
}

function MetricVisualBlock({ visual }: { visual: MetricVisual }) {
  const iconProps = {
    size: 20,
    strokeWidth: 1.6,
    className:
      'text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors duration-300',
  };

  if (visual === 'bars') {
    return <CheckCircle2 {...iconProps} />;
  }

  if (visual === 'scan') {
    return <Clock {...iconProps} />;
  }

  return <FileText {...iconProps} />;
}

export function MetricCard({
  className,
  description,
  eyebrow,
  value,
  visual = 'pulse',
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col items-start gap-5 rounded-[12px] border border-black/[0.06] bg-white p-6 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
        className,
      )}
    >
      <div className="flex size-8 items-center justify-start text-muted-foreground/40 transition-transform duration-300 group-hover:scale-110">
        <MetricVisualBlock visual={visual} />
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[32px] font-medium tracking-tight text-foreground leading-none"
        >
          {value}
        </motion.div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
          {eyebrow}
        </p>
      </div>
    </div>
  );
}
