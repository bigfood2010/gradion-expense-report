import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { EmptyState } from '@client/components/molecules/empty-state';
import { RootDocumentTemplate } from '@client/components/templates/root-document-template';
import type { AppRouterContext } from '@client/lib/router-context';

function RootRouteComponent() {
  return (
    <>
      <RootDocumentTemplate>
        <Outlet />
      </RootDocumentTemplate>
      <Toaster closeButton position="top-right" richColors />
    </>
  );
}

function NotFoundRouteComponent() {
  return (
    <div className="route-state">
      <EmptyState
        title="Route Not Found"
        description="This route has not been wired into the atomic shell yet."
      />
    </div>
  );
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: RootRouteComponent,
  notFoundComponent: NotFoundRouteComponent,
});
