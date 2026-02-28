import { NextResponse } from 'next/server'

import {
  fetchAnthropicModels,
  fetchOpenAIModels,
  TranslationError,
} from '@flow/reader/translate'
import type { AIProvider } from '@flow/reader/state'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const provider = body?.provider as AIProvider | undefined
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 },
      )
    }
    if (provider !== 'anthropic' && provider !== 'openai') {
      return NextResponse.json(
        { error: 'Invalid provider. Use "anthropic" or "openai".' },
        { status: 400 },
      )
    }

    const fetchModels =
      provider === 'openai' ? fetchOpenAIModels : fetchAnthropicModels
    const models = await fetchModels(apiKey)

    return NextResponse.json({ models })
  } catch (err) {
    if (err instanceof TranslationError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode ?? 500 },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch models' },
      { status: 500 },
    )
  }
}
