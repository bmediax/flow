import type { AIProvider } from "@flow/reader/state";

import { TranslationError, translateTextWithAI } from "@flow/reader/translate";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const text = typeof body?.text === "string" ? body.text : "";
		const provider = body?.provider as AIProvider | undefined;
		let apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
		const model = typeof body?.model === "string" ? body.model : "";

		// Server-side fallback for development: use env key when client sends none
		if (!apiKey && provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
			apiKey = process.env.ANTHROPIC_API_KEY;
		}

		const instructions =
			typeof body?.instructions === "string" ? body.instructions : undefined;
		const targetLanguage =
			typeof body?.targetLanguage === "string"
				? body.targetLanguage
				: undefined;

		if (!apiKey || !model) {
			return NextResponse.json(
				{ error: "API key and model are required" },
				{ status: 400 },
			);
		}
		if (provider !== "anthropic" && provider !== "openai") {
			return NextResponse.json(
				{ error: 'Invalid provider. Use "anthropic" or "openai".' },
				{ status: 400 },
			);
		}

		const translated = await translateTextWithAI(
			text,
			provider,
			apiKey,
			model,
			instructions,
			targetLanguage,
		);

		return NextResponse.json({ text: translated });
	} catch (err) {
		if (err instanceof TranslationError) {
			return NextResponse.json(
				{ error: err.message },
				{ status: err.statusCode ?? 500 },
			);
		}
		return NextResponse.json(
			{
				error:
					err instanceof Error ? err.message : "Translation request failed",
			},
			{ status: 500 },
		);
	}
}
