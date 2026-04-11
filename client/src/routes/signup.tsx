import { createFileRoute } from '@tanstack/react-router';
import { SignupPage } from '@client/components/pages/auth/signup-page';

export const Route = createFileRoute('/signup' as any)({
  component: SignupPage,
});
