import { NextRequest, NextResponse } from 'next/server';

import { autocomplete } from '@/lib/search/query-builder';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';

  if (q.trim().length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await autocomplete(q);
  return NextResponse.json(
    { suggestions },
    { headers: { 'Cache-Control': 'public, s-maxage=60' } },
  );
}
