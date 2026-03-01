import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

const kindeHandler = handleAuth();

/**
 * Wrap Kinde auth to break the redirect loop when the callback returns an error
 * (e.g. login_link_expired). Without this, callback → login → Kinde → callback
 * repeats and floods logs. On callback error we clear Kinde cookies and redirect
 * to app with ?auth_error= so the user sees a message instead of looping.
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

		const response = NextResponse.redirect(redirectUrl, 303);

		// Clear all Kinde-related cookies to stop the re-auth loop
		const cookiesToClear = [
			"kinde_token",
			"kinde_access_token",
			"kinde_id_token",
			"kinde_refresh_token",
			"kinde_user",
			"id_token_payload",
			"access_token_payload",
		];

		for (const cookie of cookiesToClear) {
			response.cookies.set(cookie, "", {
				expires: new Date(0),
				path: "/",
			});
		}

		return response;
	}

	// If client is already on the auth-error page (e.g. login_link_expired), don't
	// send them to Kinde again — redirect back to same error to stop request flood.
	if (kindeAuth === "login") {
		const referer = request.headers.get("referer");
		const authErrorMatch =
			referer && /[?&]auth_error=([^&]+)/.exec(referer);
		if (authErrorMatch) {
			const error = authErrorMatch[1];
			const redirectUrl = new URL("/", url.origin);
			redirectUrl.searchParams.set("auth_error", decodeURIComponent(error));
			return NextResponse.redirect(redirectUrl, 303);
		}
	}

	return kindeHandler(request, context);
}
