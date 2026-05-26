import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Phone, MessageCircle, Clock, Search } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { RequestRowActions } from '@/components/admin/RequestRowActions';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo, formatLKR } from '@/lib/utils';

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>;
}

const STATUSES = [
  { id: 'new',         label: 'New',         color: 'bg-blue-100 text-blue-700' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  { id: 'fulfilled',   label: 'Fulfilled',   color: 'bg-green-100 text-green-700' },
  { id: 'closed',      label: 'Closed',      color: 'bg-gray-100 text-gray-700' },
  { id: 'spam',        label: 'Spam',        color: 'bg-red-100 text-red-700' },
];

export default async function RequestsAdminPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { status, q } = await searchParams;
  const filterStatus = status ?? 'new';

  const supabase = createServiceClient();

  let query = supabase
    .from('vehicle_requests')
    .select(
      `
      id, contact_phone, contact_name, whatsapp_pref,
      make, model, year_min, year_max,
      budget_min, budget_max,
      source, source_query,
      status, contacted_at, fulfilled_at, created_at,
      vehicle_types ( name_en ),
      districts ( name_en )
    `,
    )
    .eq('status', filterStatus)
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(
      `contact_phone.ilike.%${q}%,contact_name.ilike.%${q}%,model.ilike.%${q}%,make.ilike.%${q}%`,
    );
  }

  const { data: requests } = await query;

  // Count per status for tab labels
  const counts: Record<string, number> = {};
  for (const s of STATUSES) {
    const { count } = await supabase
      .from('vehicle_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', s.id);
    counts[s.id] = count ?? 0;
  }

  return (
    <AdminShell
      title="Vehicle Requests"
      subtitle={`${requests?.length ?? 0} ${filterStatus} requests`}
    >
      {/* Status tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-1">
        {STATUSES.map((s) => (
          <Link
            key={s.id}
            href={`/admin/requests?status=${s.id}${q ? `&q=${q}` : ''}`}
            className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm transition-colors ${
              filterStatus === s.id
                ? 'border-b-2 border-[var(--brand-green)] font-medium text-[var(--brand-deep)]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
            <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-600">
              {counts[s.id] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-4" action="/admin/requests">
        <input type="hidden" name="status" value={filterStatus} />
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search phone, name, make, model..."
            className="w-full rounded-lg border border-[var(--color-border)] py-2 pl-10 pr-3 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
      </form>

      {/* List */}
      {!requests || requests.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-white py-16 text-center text-gray-400">
          No {filterStatus} requests.
        </div>
      ) : (
        <div className="space-y-3">
          {(requests as any[]).map((r) => (
            <RequestCard key={r.id} req={r} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function RequestCard({ req }: { req: any }) {
  const waMessage = `Hi${req.contact_name ? ` ${req.contact_name}` : ''}, this is Siraa.lk regarding your vehicle request${
    req.make || req.model ? ` for ${req.make ?? ''} ${req.model ?? ''}` : ''
  }. We have some matches to share!`;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-semibold">{req.contact_phone}</p>
            {req.contact_name && (
              <span className="text-sm text-gray-600">· {req.contact_name}</span>
            )}
            {req.source === 'failed_search' && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                From search
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-400">{timeAgo(req.created_at)}</p>
        </div>

        <RequestRowActions
          requestId={req.id}
          status={req.status}
          phone={req.contact_phone}
          whatsappPref={req.whatsapp_pref}
          waMessage={waMessage}
        />
      </div>

      {/* What they want */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <Field label="Type">{req.vehicle_types?.name_en ?? '—'}</Field>
        <Field label="Make/Model">
          {req.make || req.model
            ? `${req.make ?? ''} ${req.model ?? ''}`.trim()
            : '—'}
        </Field>
        <Field label="Year">
          {req.year_min && req.year_max && req.year_min === req.year_max
            ? req.year_min
            : req.year_min || req.year_max
              ? `${req.year_min ?? '?'}–${req.year_max ?? '?'}`
              : '—'}
        </Field>
        <Field label="Budget">
          {req.budget_min || req.budget_max
            ? `${req.budget_min ? formatLKR(req.budget_min) : 'Any'} – ${
                req.budget_max ? formatLKR(req.budget_max) : 'Any'
              }`
            : '—'}
        </Field>
        <Field label="District">{req.districts?.name_en ?? '—'}</Field>
        <Field label="Preferred contact">
          {req.whatsapp_pref ? (
            <span className="inline-flex items-center gap-1 text-[#25D366]">
              <MessageCircle className="h-3 w-3" />
              WhatsApp
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[var(--brand-green)]">
              <Phone className="h-3 w-3" />
              Call
            </span>
          )}
        </Field>
      </div>

      {/* Original search query if from failed search */}
      {req.source_query && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <strong>Original search:</strong> &quot;{req.source_query}&quot;
        </div>
      )}

      {/* Description */}
      {req.description && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {req.description}
        </div>
      )}

      {/* Status footer */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {req.contacted_at && (
          <span>Contacted {timeAgo(req.contacted_at)}</span>
        )}
        {req.fulfilled_at && (
          <span>Fulfilled {timeAgo(req.fulfilled_at)}</span>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-800">{children}</p>
    </div>
  );
}
