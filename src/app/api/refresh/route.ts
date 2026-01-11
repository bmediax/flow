import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Dropbox } from 'dropbox'

import { mapToToken } from '../../../sync'

const dbx = new Dropbox({
  clientId: process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID,
  clientSecret: process.env.DROPBOX_CLIENT_SECRET,
})

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(mapToToken['dropbox'])?.value

  if (typeof token !== 'string') {
    return new NextResponse(null, { status: 401 })
  }

  dbx.auth.setRefreshToken(token)
  await dbx.auth.refreshAccessToken()

  return NextResponse.json({
    accessToken: dbx.auth.getAccessToken(),
    accessTokenExpiresAt: dbx.auth.getAccessTokenExpiresAt(),
  })
}
