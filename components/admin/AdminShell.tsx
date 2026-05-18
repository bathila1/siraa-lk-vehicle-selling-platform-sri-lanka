import { AdminSidebar } from './AdminSidebar';

interface Props {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, subtitle, actions, children }: Props) {
  return (
    <div className="min-h-screen flex bg-[var(--brand-bg)]">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {title && (
            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap pl-12 md:pl-0">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--brand-deep)]">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
