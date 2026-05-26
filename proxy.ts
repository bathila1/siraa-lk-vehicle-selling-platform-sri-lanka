import { NextResponse, type NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

import { updateSession } from '@/lib/supabase/middleware';
import { verifyOrigin } from '@/lib/auth/csrf';

/**
 * Runs on every request. Keep this fast.
 *  - Skips static assets
 *  - Enforces body size limit on API routes
 *  - Enforces CSRF (Origin check) on mutating API routes
 *  - Refreshes Supabase auth cookies
 *  - SLIDING SESSION: re-issues siraa_session cookie with fresh 90d expiry
 */

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB hard cap (above this = reject)
const MAX_API_BODY_BYTES = 1 * 1024 * 1024; // 1MB for JSON API endpoints

const SESSION_COOKIE = 'siraa_session';
const SESSION_TTL_DAYS = 90;

// API endpoints that legitimately don't have an Origin header.
// PayHere posts IPN webhooks server-to-server — those have signature verification.
const CSRF_EXEMPT_PATHS = [
  '/api/payhere/ipn',
  '/api/cron/', // cron jobs from Vercel
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf)$/i)
  ) {
    return NextResponse.next();
  }

  // Body size protection — reject huge requests before they reach our code
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const limit = pathname.startsWith('/api/') ? MAX_API_BODY_BYTES : MAX_BODY_BYTES;

    // Allow larger bodies for file upload routes (presigned uploads go directly to R2,
    // but if you ever proxy them, increase this)
    const isUploadRoute = pathname.includes('/upload') || pathname.includes('/image');
    const effectiveLimit = isUploadRoute ? MAX_BODY_BYTES : limit;

    if (!isNaN(size) && size > effectiveLimit) {
      return NextResponse.json(
        { error: 'Request body too large.' },
        { status: 413 },
      );
    }
  }

  // CSRF protection on state-changing API requests
  if (pathname.startsWith('/api/')) {
    const exempt = CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
    if (!exempt) {
      const csrfBlock = verifyOrigin(request);
      if (csrfBlock) return csrfBlock;
    }
  }

  // Process Supabase session (existing)
  const response = await updateSession(request);

  // Sliding session refresh — extends siraa_session if valid + older than 1 day
  await refreshSlidingSession(request, response);

  return response;
}

/**
 * Re-issues siraa_session cookie with fresh expiry if current one is valid.
 *
 * Throttled: only refreshes if the existing cookie is older than 1 day,
 * so we're not signing JWTs on every single page load.
 *
 * Effect: active users (visit at least once every 90 days) effectively
 * never log out. Inactive users expire naturally after 90 days.
 */
async function refreshSlidingSession(request: NextRequest, response: NextResponse) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    // Only refresh once per day, not on every request
    const issuedAt = (payload.iat as number) ?? 0;
    const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
    if (ageSeconds < 24 * 60 * 60) return; // less than 1 day old — skip

    // Strip JWT-internal fields so we don't carry over old iat/exp
    const { iat, exp, nbf, ...userPayload } = payload as any;

    const newToken = await new SignJWT(userPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_TTL_DAYS}d`)
      .sign(new TextEncoder().encode(secret));

    response.cookies.set(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    });
  } catch {
    // Invalid/expired token — let session.ts handle it (returns null on getSession)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf)).*)',
  ],
};