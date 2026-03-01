import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { isAuthenticated, getUser } = getKindeServerSession()

  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
    })
  }

  const user = await getUser()

  return NextResponse.json({
    isAuthenticated: true,
    user: user
      ? {
          id: user.id,
          email: user.email,
        }
      : null,
  })
}
