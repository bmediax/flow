import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware'
import { NextRequest } from 'next/server'

export default function middleware(req: NextRequest) {
  return withAuth(req, {
    isReturnToCurrentPage: true,
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (all API routes including auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (icons, manifest, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
}
