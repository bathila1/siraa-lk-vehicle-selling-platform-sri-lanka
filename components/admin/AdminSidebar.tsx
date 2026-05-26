'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  AlertTriangle,
  Zap,
  CreditCard,
  Settings,
  ListFilter,
  Tag,
  ScrollText,
  MapPin,
  FileText,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
      { href: '/admin/sellers', label: 'Sellers', icon: Users },
      { href: '/admin/requests', label: 'Requests', icon: Sparkles },
      { href: '/admin/reports', label: 'Reports', icon: AlertTriangle },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { href: '/admin/boosts', label: 'Active Boosts', icon: Zap },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/boost-config', label: 'Boost Config', icon: Settings },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/types-makes', label: 'Types & Makes', icon: Tag },
      { href: '/admin/attributes', label: 'Custom Fields', icon: ListFilter },
      { href: '/admin/locations', label: 'Locations', icon: MapPin },
      { href: '/admin/blog', label: 'Blog', icon: FileText },
      { href: '/admin/settings', label: 'Site Settings', icon: Settings },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Sign out of admin?')) return;
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 bg-white p-2 rounded-lg shadow border border-[var(--color-border)]"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-white border-r border-[var(--color-border)] flex flex-col flex-shrink-0',
          'fixed inset-y-0 left-0 z-50 transition-transform md:relative md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <Link href="/admin" className="font-bold text-lg text-[var(--brand-deep)]">
            Siraa<span className="text-[var(--brand-green)]">.lk</span>
            <span className="text-xs text-gray-400 ml-2 font-normal">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 text-sm">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide px-2 mb-1.5">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 transition-colors',
                      isActive
                        ? 'bg-[var(--brand-bg)] text-[var(--brand-deep)] font-medium'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
