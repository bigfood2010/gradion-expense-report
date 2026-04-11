import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '@client/components/pages/auth/login-page';

export const Route = createFileRoute('/login' as any)({
  component: LoginPage,
});
