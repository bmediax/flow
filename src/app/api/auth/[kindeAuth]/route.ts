import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

const kindeHandler = handleAuth();

/**
 * Wrap Kinde auth to break the redirect loop when the callback returns an error
 * (e.g. login_link_expired). Without this, callback → login → Kinde → callback
 * repeats and floods logs. On callback error we redirect to app with ?auth_error=
 * so the user sees a message instead of being sent back to login.
 */
export async function GET(
	request: Request,
	context: { params: Promise<{ kindeAuth: string }> },
) {
	const { kindeAuth } = await context.params;
	const url = new URL(request.url);

	if (kindeAuth === "kinde_callback" && url.searchParams.has("error")) {
		const error = url.searchParams.get("error") ?? "unknown";
		const redirectUrl = new URL("/", url.origin);
		redirectUrl.searchParams.set("auth_error", error);
		return NextResponse.redirect(redirectUrl, 303);
	}

	return kindeHandler(request, context);
}
