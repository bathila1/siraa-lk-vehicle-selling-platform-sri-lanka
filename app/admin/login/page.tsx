import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { getAdminSession } from '@/lib/auth/admin-session';

export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect('/admin');

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--brand-bg)]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[var(--brand-deep)]">Siraa Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Authorized personnel only</p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
