import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { NextResponse } from 'next/server'
import {
  getUserProperties,
  updateUserProperties,
  type ThemeProperties,
} from '@flow/reader/kinde-management'

export interface ThemePreferences {
  sourceColor?: string
  background?: number
  colorScheme?: 'light' | 'dark' | 'system'
}

function propertiesToPreferences(props: ThemeProperties): ThemePreferences {
  const preferences: ThemePreferences = {}

  if (props.theme_source_color) {
    preferences.sourceColor = props.theme_source_color
  }
  if (props.theme_background) {
    const bg = parseInt(props.theme_background, 10)
    if (!Number.isNaN(bg)) {
      preferences.background = bg
    }
  }
  if (props.theme_color_scheme) {
    const scheme = props.theme_color_scheme as 'light' | 'dark' | 'system'
    if (['light', 'dark', 'system'].includes(scheme)) {
      preferences.colorScheme = scheme
    }
  }

  return preferences
}

function preferencesToProperties(prefs: ThemePreferences): ThemeProperties {
  const properties: ThemeProperties = {}

  if (prefs.sourceColor !== undefined) {
    properties.theme_source_color = prefs.sourceColor
  }
  if (prefs.background !== undefined) {
    properties.theme_background = String(prefs.background)
  }
  if (prefs.colorScheme !== undefined) {
    properties.theme_color_scheme = prefs.colorScheme
  }

  return properties
}

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
    const properties = await getUserProperties(user.id)
    const preferences = propertiesToPreferences(properties)
    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Failed to fetch theme preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
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
    const body = (await request.json()) as ThemePreferences

    if (body.sourceColor !== undefined && typeof body.sourceColor !== 'string') {
      return NextResponse.json(
        { error: 'Invalid sourceColor' },
        { status: 400 }
      )
    }
    if (body.background !== undefined && typeof body.background !== 'number') {
      return NextResponse.json(
        { error: 'Invalid background' },
        { status: 400 }
      )
    }
    if (
      body.colorScheme !== undefined &&
      !['light', 'dark', 'system'].includes(body.colorScheme)
    ) {
      return NextResponse.json(
        { error: 'Invalid colorScheme' },
        { status: 400 }
      )
    }

    const properties = preferencesToProperties(body)
    await updateUserProperties(user.id, properties)

    return NextResponse.json({ success: true, preferences: body })
  } catch (error) {
    console.error('Failed to update theme preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
