import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Siraa.lk with your phone number',
};

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();
  const { next } = await searchParams;

  if (session) {
    redirect(next ?? '/dashboard');
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--brand-bg)] px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-[var(--brand-deep)]">Sign In</h1>
            <p className="mt-1 text-sm text-gray-500">Use your mobile number to continue</p>
          </div>
          <LoginForm redirectTo={next ?? '/dashboard'} />
        </div>
      </main>
    </>
  );
}
