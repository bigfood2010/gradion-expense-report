import { Navigate, createFileRoute } from '@tanstack/react-router';
import { DashboardPage } from '@client/components/pages/dashboard/dashboard-page';
import { useAuth } from '@client/lib/auth-context';

export const Route = createFileRoute('/_authenticated/' as any)({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to={'/admin' as any} replace />;
  }

  return <DashboardPage />;
}
