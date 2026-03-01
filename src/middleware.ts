import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Custom middleware that wraps Kinde's withAuth to prevent infinite redirect loops.
 * When auth fails with an error (e.g. login_link_expired), we skip the auth check
 * to allow the user to see the error message instead of being stuck in a loop.
 */
export default async function middleware(request: NextRequest) {
  const url = request.nextUrl

  // If there's an auth_error query param, skip auth to break the redirect loop
  // This happens when Kinde callback returns an error and we redirect to /?auth_error=...
  if (url.searchParams.has('auth_error')) {
    return NextResponse.next()
  }

  // Skip auth check for prefetch/preload requests to avoid unnecessary redirects
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-middleware-prefetch') === '1' ||
    request.headers.get('sec-fetch-dest') === 'empty'
  if (isPrefetch) {
    return NextResponse.next()
  }

  // Skip auth when request comes from the auth-error page (e.g. prefetch or
  // navigation that dropped the query) to avoid redirect storms.
  const referer = request.headers.get('referer')
  if (referer && /[?&]auth_error=/.test(referer)) {
    return NextResponse.next()
  }

  // Otherwise, use Kinde's auth middleware
  return withAuth(request)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (all API endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest, sw.js, workbox (public assets and service worker)
     */
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|icons|manifest.json|sw.js|workbox).*)',
  ],
}
