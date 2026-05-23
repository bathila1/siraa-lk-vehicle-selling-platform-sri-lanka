// import { NextResponse, type NextRequest } from 'next/server';

// import { updateSession } from '@/lib/supabase/middleware';

// /**
//  * Runs on every request. Keep this fast.
//  *  - Refreshes Supabase auth cookies
//  *  - Will host rate-limit + admin route guard later
//  */
// export async function proxy(request: NextRequest) {
//   // Skip middleware for static assets and API health checks
//   const { pathname } = request.nextUrl;
//   if (
//     pathname.startsWith('/_next') ||
//     pathname.startsWith('/favicon') ||
//     pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf)$/i)
//   ) {
//     return NextResponse.next();
//   }

//   return await updateSession(request);
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico
//      * - public files
//      */
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf)).*)',
//   ],
// };


import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { verifyOrigin } from '@/lib/auth/csrf';

/**
 * Runs on every request. Keep this fast.
 *  - Skips static assets
 *  - Enforces body size limit on API routes
 *  - Enforces CSRF (Origin check) on mutating API routes
 *  - Refreshes Supabase auth cookies
 */

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB hard cap (above this = reject)
const MAX_API_BODY_BYTES = 1 * 1024 * 1024; // 1MB for JSON API endpoints

// API endpoints that legitimately don't have an Origin header.
// PayHere posts IPN webhooks server-to-server — those have signature verification.
const CSRF_EXEMPT_PATHS = [
  '/api/payhere/ipn',
  '/api/cron/', // cron jobs from Vercel
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
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

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf)).*)',
  ],
};
