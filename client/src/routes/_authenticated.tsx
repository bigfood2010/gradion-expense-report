import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@client/lib/auth-context';

export const Route = createFileRoute('/_authenticated' as any)({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout(): React.ReactElement {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <Navigate to={'/login' as any} replace />;
  }

  return <Outlet />;
}
