import type { FormEvent, ReactElement, RefObject } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@client/lib/motion';

export type AuthFormMode = 'login' | 'signup';

export interface AuthFormValues {
  readonly email: string;
  readonly password: string;
}

export interface AuthFormProps {
  readonly mode: AuthFormMode;
  readonly values: AuthFormValues;
  readonly loading: boolean;
  readonly error: string | null;
  readonly errorRef?: RefObject<HTMLParagraphElement | null>;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onFieldChange: (field: keyof AuthFormValues, value: string) => void;
}

export function AuthForm({
  error,
  errorRef,
  loading,
  mode,
  onFieldChange,
  onSubmit,
  values,
}: AuthFormProps): ReactElement {
  const isSignup = mode === 'signup';

  return (
    <motion.form
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="mt-6 flex flex-col gap-4 sm:mt-8 sm:gap-6"
      onSubmit={onSubmit}
    >
      <motion.div variants={fadeInUp} className="flex flex-col">
        <label
          htmlFor="email"
          className="mb-1 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground sm:text-[13px]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          spellCheck={false}
          value={values.email}
          onChange={(event) => onFieldChange('email', event.target.value)}
          className="auth-input w-full appearance-none border-0 border-b border-border bg-transparent px-0 py-3 text-[16px] text-foreground placeholder:text-[#A3A3A3] outline-none transition-colors duration-150 focus:border-border focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="mb-2 flex flex-col">
        <label
          htmlFor="password"
          className="mb-1 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground sm:text-[13px]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          required
          value={values.password}
          onChange={(event) => onFieldChange('password', event.target.value)}
          className="auth-input w-full appearance-none border-0 border-b border-border bg-transparent px-0 py-3 text-[16px] text-foreground placeholder:text-[#A3A3A3] outline-none transition-colors duration-150 focus:border-border focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        />
      </motion.div>

      {error && (
        <motion.p
          variants={fadeInUp}
          ref={errorRef}
          aria-live="polite"
          className="mt-2 text-[13px] text-status-rejected-text"
          role="alert"
          tabIndex={-1}
        >
          {error}
        </motion.p>
      )}

      <motion.button
        variants={fadeInUp}
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-md bg-foreground py-4 text-[16px] font-medium text-white transition-[opacity,background-color] duration-150 ease-out hover:bg-foreground/90 disabled:opacity-50 sm:mt-4 sm:py-4 sm:text-[17px]"
      >
        {loading ? '...' : isSignup ? 'Create account' : 'Sign in'}
      </motion.button>
    </motion.form>
  );
}
