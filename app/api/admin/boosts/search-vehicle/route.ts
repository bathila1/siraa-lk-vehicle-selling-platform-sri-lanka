import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year,
      vehicle_makes ( name ),
      sellers ( phone )
    `,
    )
    .eq('status', 'active')
    .or(`model.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(20);

  const results = (data ?? []).map((v: any) => ({
    id: v.id,
    slug: v.slug,
    title: `${v.year} ${v.vehicle_makes?.name ?? ''} ${v.model}`,
    seller_phone: v.sellers?.phone ?? '',
  }));

  return NextResponse.json({ results });
}