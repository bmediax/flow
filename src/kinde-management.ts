const KINDE_ISSUER_URL = process.env.KINDE_ISSUER_URL!;
const KINDE_MANAGEMENT_CLIENT_ID = process.env.KINDE_MANAGEMENT_CLIENT_ID!;
const KINDE_MANAGEMENT_CLIENT_SECRET =
	process.env.KINDE_MANAGEMENT_CLIENT_SECRET!;

interface TokenCache {
	token: string;
	expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getManagementToken(): Promise<string> {
	if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
		return tokenCache.token;
	}

	const response = await fetch(`${KINDE_ISSUER_URL}/oauth2/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: KINDE_MANAGEMENT_CLIENT_ID,
			client_secret: KINDE_MANAGEMENT_CLIENT_SECRET,
			audience: `${KINDE_ISSUER_URL}/api`,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to get management token: ${error}`);
	}

	const data = await response.json();
	tokenCache = {
		token: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000,
	};

	return tokenCache.token;
}

export interface ThemeProperties {
	theme_source_color?: string;
	theme_background?: string;
	theme_color_scheme?: string;
}

export async function getUserProperties(
	userId: string,
): Promise<ThemeProperties> {
	const token = await getManagementToken();

	const response = await fetch(
		`${KINDE_ISSUER_URL}/api/v1/users/${userId}/properties`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		},
	);

	if (!response.ok) {
		if (response.status === 404) {
			return {};
		}
		const error = await response.text();
		throw new Error(`Failed to get user properties: ${error}`);
	}

	const data = await response.json();
	const properties: ThemeProperties = {};

	// Kinde prefixes user properties with kp_usr_
	if (data.properties) {
		for (const prop of data.properties) {
			const key = prop.key as string;
			if (key === "theme_source_color" || key === "kp_usr_theme_source_color") {
				properties.theme_source_color = prop.value;
			} else if (
				key === "theme_background" ||
				key === "kp_usr_theme_background"
			) {
				properties.theme_background = prop.value;
			} else if (
				key === "theme_color_scheme" ||
				key === "kp_usr_theme_color_scheme"
			) {
				properties.theme_color_scheme = prop.value;
			}
		}
	}

	return properties;
}

async function updateSingleProperty(
	token: string,
	userId: string,
	propertyKey: string,
	value: string,
): Promise<void> {
	const url = `${KINDE_ISSUER_URL}/api/v1/users/${userId}/properties/${propertyKey}`;

	console.log(`Updating property: ${url}`);

	const response = await fetch(url, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ value }),
	});

	if (!response.ok) {
		const error = await response.text();
		console.error(
			`Failed to update property ${propertyKey}:`,
			response.status,
			error,
		);
		// Don't throw for 404 - property might not exist yet
		if (response.status === 404) {
			console.warn(`Property ${propertyKey} not found - skipping`);
			return;
		}
		throw new Error(`Failed to update property ${propertyKey}: ${error}`);
	}
}

export async function updateUserProperties(
	userId: string,
	properties: ThemeProperties,
): Promise<void> {
	const token = await getManagementToken();

	// Run updates sequentially to avoid Kinde API rate limits
	if (properties.theme_source_color !== undefined) {
		await updateSingleProperty(
			token,
			userId,
			"theme_source_color",
			properties.theme_source_color,
		);
	}

	if (properties.theme_background !== undefined) {
		await updateSingleProperty(
			token,
			userId,
			"theme_background",
			properties.theme_background,
		);
	}

	if (properties.theme_color_scheme !== undefined) {
		await updateSingleProperty(
			token,
			userId,
			"theme_color_scheme",
			properties.theme_color_scheme,
		);
	}
}
