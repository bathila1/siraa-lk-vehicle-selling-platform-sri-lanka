import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/server';
import { saveShareSchema } from '@/lib/validations/schemas';
import { randomShortId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = saveShareSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const shareCode = randomShortId(8);

  const { error } = await supabase.from('saved_lists').insert({
    share_code: shareCode,
    vehicle_ids: parsed.data.vehicleIds,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }

  return NextResponse.json({ shareCode });
}
