import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Dropbox } from 'dropbox'

import { mapToToken } from '../../../../sync'

const dbx = new Dropbox({
  clientId: process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID,
  clientSecret: process.env.DROPBOX_CLIENT_SECRET,
  fetch,
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = searchParams.get('state')
  const code = searchParams.get('code')

  if (typeof state !== 'string' || typeof code !== 'string') {
    return new NextResponse(null, { status: 400 })
  }

  const parsedState = JSON.parse(state)

  const response = await dbx.auth.getAccessTokenFromCode(
    parsedState.redirectUri,
    code,
  )
  const result = response.result as any

  const cookieStore = await cookies()
  cookieStore.set(mapToToken['dropbox'], result.refresh_token, {
    maxAge: 365 * 24 * 60 * 60,
    secure: true,
    path: '/',
  })

  return NextResponse.redirect(new URL('/success', request.url))
}
