import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
}

export function SectionHeader({ actions, description, eyebrow, title }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <div className="section-header__copy">
        {eyebrow ? <div className="section-header__eyebrow">{eyebrow}</div> : null}
        <h1 className="section-header__title">{title}</h1>
        {description ? <p className="section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="u-cluster">{actions}</div> : null}
    </header>
  );
}
