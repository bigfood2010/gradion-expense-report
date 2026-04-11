import type { PropsWithChildren } from 'react';

export function RootDocumentTemplate({ children }: PropsWithChildren) {
  return (
    <div className="root-document">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <main id="main-content" className="root-document__main">
        <div className="u-main-frame">{children}</div>
      </main>
    </div>
  );
}
