import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids') ?? '';
  const ids = idsParam
    .split(',')
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0)
    .slice(0, 100); // safety cap

  if (ids.length === 0) {
    return NextResponse.json({ vehicles: [] });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price,
      vehicle_makes ( name ),
      districts ( name_en ),
      cities ( name_en ),
      vehicle_images ( url, is_primary, sort_order )
    `,
    )
    .in('id', ids)
    .eq('status', 'active');

  const vehicles = (data ?? []).map((row: any) => {
    const images = (row.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      slug: row.slug,
      title: `${row.year} ${row.vehicle_makes?.name} ${row.model}`,
      price: row.price,
      image: images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null,
      location: [row.cities?.name_en, row.districts?.name_en].filter(Boolean).join(', '),
    };
  });

  return NextResponse.json({ vehicles });
}
