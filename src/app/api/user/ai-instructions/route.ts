import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { NextResponse } from 'next/server'
import {
  getAiTranslationInstructions,
  updateAiTranslationInstructions,
} from '@flow/reader/kinde-management'

export async function GET() {
  const { isAuthenticated, getUser } = getKindeServerSession()
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await getUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }
  try {
    const instructions = await getAiTranslationInstructions(user.id)
    return NextResponse.json({ instructions: instructions ?? '' })
  } catch (error) {
    console.error('Failed to fetch AI instructions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructions' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const { isAuthenticated, getUser } = getKindeServerSession()
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await getUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }
  try {
    const body = (await request.json()) as { instructions?: string }
    const instructions =
      typeof body.instructions === 'string' ? body.instructions : ''
    await updateAiTranslationInstructions(user.id, instructions)
    return NextResponse.json({ success: true, instructions })
  } catch (error) {
    console.error('Failed to update AI instructions:', error)
    return NextResponse.json(
      { error: 'Failed to update instructions' },
      { status: 500 }
    )
  }
}
