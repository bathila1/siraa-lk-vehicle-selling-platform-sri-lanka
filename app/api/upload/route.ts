import { NextRequest, NextResponse } from 'next/server';

import { imageUploadSchema } from '@/lib/validations/schemas';
import { getSession } from '@/lib/auth/session';
import { buildImageKey, getPresignedUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = imageUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid file metadata. Max 8 MB, JPG/PNG/WebP only.' },
      { status: 400 },
    );
  }

  // Build storage key — namespaced by seller, not by vehicle yet (vehicle ID doesn't exist before publish)
  const key = buildImageKey(`sellers/${session.seller_id}`, parsed.data.filename);
  const uploadUrl = await getPresignedUploadUrl(key, parsed.data.contentType);
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
