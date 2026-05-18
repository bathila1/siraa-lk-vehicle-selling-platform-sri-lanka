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
      <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8 bg-[var(--brand-bg)]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--brand-deep)]">Sign In</h1>
            <p className="text-sm text-gray-500 mt-1">
              Use your mobile number to continue
            </p>
          </div>
          <LoginForm redirectTo={next ?? '/dashboard'} />
        </div>
      </main>
    </>
  );
}
