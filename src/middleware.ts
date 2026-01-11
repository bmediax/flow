import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware'

export default withAuth

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth (Kinde auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest (public assets)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
}
