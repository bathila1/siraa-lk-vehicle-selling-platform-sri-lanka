import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · Siraa',
  robots: { index: false, follow: false },
};

/**
 * Admin layout — DOES NOT enforce auth here because /admin/login also lives
 * inside /admin. Each child page enforces its own session check via
 * requireAdmin() / getAdminSession().
 *
 * The visual sidebar layout is applied via the AdminShell component on each
 * authenticated page, not here.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
