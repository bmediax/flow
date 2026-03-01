import { decrypt, encrypt } from "@flow/reader/crypto";
import {
	type ColorScheme,
	useAuth,
	useColorScheme,
	useForceRender,
	useTranslation,
} from "@flow/reader/hooks";
import { AI_PROVIDERS, type AIProvider, useSettings } from "@flow/reader/state";
import { dbx, mapToToken, OAUTH_SUCCESS_MESSAGE } from "@flow/reader/sync";
import type { AIModelOption } from "@flow/reader/translate";
import { useEventListener } from "@literal-ui/hooks";
import Dexie from "dexie";
import { destroyCookie, parseCookies } from "nookies";
import { useEffect, useState } from "react";
import useLocalStorageState from "use-local-storage-state";

import { Button } from "../Button";
import { Checkbox, Select, TextField } from "../Form";
import { Page } from "../Page";

type Locale = "en-US" | "zh-CN" | "ja-JP";

export const Settings: React.FC = () => {
	const { scheme, setScheme } = useColorScheme();
	const [locale, setLocale] = useLocalStorageState<Locale>("locale", {
		defaultValue: "en-US",
	});
	const [settings, setSettings] = useSettings();
	const t = useTranslation("settings");

	return (
		<Page headline={t("title")}>
			<div className="space-y-6">
				<Item title={t("language")}>
					<Select
						value={locale}
						onChange={(e) => {
							setLocale(e.target.value as Locale);
						}}
					>
						<option value="en-US">English</option>
						<option value="zh-CN">简体中文</option>
						<option value="ja-JP">日本語</option>
					</Select>
				</Item>
				<Item title={t("color_scheme")}>
					<Select
						value={scheme}
						onChange={(e) => {
							setScheme(e.target.value as ColorScheme);
						}}
					>
						<option value="system">{t("color_scheme.system")}</option>
						<option value="light">{t("color_scheme.light")}</option>
						<option value="dark">{t("color_scheme.dark")}</option>
					</Select>
				</Item>
				<Item title={t("text_selection_menu")}>
					<Checkbox
						name={t("text_selection_menu.enable")}
						checked={settings.enableTextSelectionMenu}
						onChange={(e) => {
							setSettings({
								...settings,
								enableTextSelectionMenu: e.target.checked,
							});
						}}
					/>
				</Item>
				<AISettings />
				<Synchronization />
				<Item title={t("cache")}>
					<Button
						variant="secondary"
						onClick={() => {
							window.localStorage.clear();
							Dexie.getDatabaseNames().then((names) => {
								names.forEach((n) => {
									void Dexie.delete(n);
								});
							});
						}}
					>
						{t("cache.clear")}
					</Button>
				</Item>
			</div>
		</Page>
	);
};

const AISettings: React.FC = () => {
	const [settings, setSettings] = useSettings();
	const { isAuthenticated } = useAuth();
	const [apiToken, setApiToken] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [availableModels, setAvailableModels] = useState<AIModelOption[]>([]);
	const [modelsLoading, setModelsLoading] = useState(false);
	const [modelsError, setModelsError] = useState<string | null>(null);
	const [instructionsSyncLoading, setInstructionsSyncLoading] = useState(false);
	const [instructionsSyncError, setInstructionsSyncError] = useState<string | null>(null);
	const t = useTranslation("settings.ai");

	const provider = (settings.ai?.provider ?? "anthropic") as AIProvider;

	// Decrypt API token on mount
	useEffect(() => {
		const loadApiToken = async () => {
			if (settings.ai?.apiToken) {
				const decrypted = await decrypt(settings.ai.apiToken);
				setApiToken(decrypted);
			}
			setIsLoading(false);
		};
		loadApiToken();
	}, [settings.ai?.apiToken]);

	// Load available models when provider and (API token or Anthropic with server env key) are set
	useEffect(() => {
		const useServerKey = provider === "anthropic" && !apiToken?.trim();
		if (!apiToken?.trim() && !useServerKey) {
			setAvailableModels([]);
			setModelsError(null);
			return;
		}
		let cancelled = false;
		setModelsLoading(true);
		setModelsError(null);
		fetch("/api/ai/models", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider, apiKey: apiToken?.trim() ?? "" }),
		})
			.then(async (res) => {
				const data = await res.json().catch(() => ({}));
				if (!res.ok) {
					throw new Error(
						data?.error ?? `Failed to load models (${res.status})`,
					);
				}
				return data.models as AIModelOption[];
			})
			.then((models) => {
				if (!cancelled) {
					setAvailableModels(models);
					setModelsError(null);
					setSettings((prev) => {
						const currentModel = prev.ai?.model;
						const hasCurrent =
							currentModel && models.some((m) => m.id === currentModel);
						if (!hasCurrent && models.length > 0) {
							return {
								...prev,
								ai: {
									...prev.ai,
									provider,
									model: models[0].id,
								},
							};
						}
						return prev;
					});
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setAvailableModels([]);
					setModelsError(err?.message ?? "Failed to load models");
				}
			})
			.finally(() => {
				if (!cancelled) setModelsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [provider, apiToken, setSettings]);

	const handleProviderChange = (newProvider: AIProvider) => {
		setSettings({
			...settings,
			ai: {
				...settings.ai,
				provider: newProvider,
				model: undefined,
			},
		});
	};

	const handleApiTokenChange = async (value: string) => {
		setApiToken(value);
		const encrypted = value ? await encrypt(value) : "";
		setSettings({
			...settings,
			ai: {
				...settings.ai,
				apiToken: encrypted,
			},
		});
	};

	const handleModelChange = (value: string) => {
		setSettings({
			...settings,
			ai: {
				...settings.ai,
				model: value,
			},
		});
	};

	const handleInstructionsChange = (value: string) => {
		setSettings({
			...settings,
			ai: {
				...settings.ai,
				instructions: value,
			},
		});
	};

	const handleTargetLanguageChange = (value: string) => {
		setSettings({
			...settings,
			ai: {
				...settings.ai,
				targetLanguage: value,
			},
		});
	};

	if (isLoading) {
		return null;
	}

	return (
		<Item title={t("title")}>
			<div className="space-y-3">
				<div>
					<label
						htmlFor="ai-provider"
						className="typescale-body-medium text-on-surface-variant mb-1 block"
					>
						{t("provider")}
					</label>
					<Select
						id="ai-provider"
						value={provider}
						onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
					>
						{Object.entries(AI_PROVIDERS).map(([key, value]) => (
							<option key={key} value={key}>
								{value.name}
							</option>
						))}
					</Select>
				</div>
				<TextField
					name={t("api_token")}
					type="password"
					value={apiToken}
					onChange={(e) => handleApiTokenChange(e.target.value)}
					placeholder={provider === "anthropic" ? "sk-ant-..." : "sk-..."}
				/>
				<div>
					<label
						htmlFor="ai-model"
						className="typescale-body-medium text-on-surface-variant mb-1 block"
					>
						{t("model")}
					</label>
					{modelsLoading ? (
						<p className="typescale-body-small text-on-surface-variant">
							Loading models…
						</p>
					) : modelsError ? (
						<p className="typescale-body-small text-red-600 dark:text-red-400">
							{modelsError}
						</p>
					) : !apiToken?.trim() ? (
						<p className="typescale-body-small text-on-surface-variant">
							Enter API key to load available models
						</p>
					) : availableModels.length === 0 ? (
						<p className="typescale-body-small text-on-surface-variant">
							No models available
						</p>
					) : (
						<Select
							id="ai-model"
							value={
								settings.ai?.model &&
								availableModels.some((m) => m.id === settings.ai?.model)
									? settings.ai.model
									: (availableModels[0]?.id ?? "")
							}
							onChange={(e) => handleModelChange(e.target.value)}
						>
							{availableModels.map((model) => (
								<option key={model.id} value={model.id}>
									{model.name}
								</option>
							))}
						</Select>
					)}
				</div>
				<TextField
					as="textarea"
					name={t("instructions")}
					value={settings.ai?.instructions ?? ""}
					onChange={(e) => handleInstructionsChange(e.target.value)}
					placeholder={t("instructions_placeholder")}
					className="h-24"
				/>
				{isAuthenticated && (
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="secondary"
							disabled={instructionsSyncLoading}
							onClick={async () => {
								setInstructionsSyncError(null);
								setInstructionsSyncLoading(true);
								try {
									const res = await fetch("/api/user/ai-instructions", {
										method: "PATCH",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
											instructions: settings.ai?.instructions ?? "",
										}),
									});
									if (!res.ok) {
										const data = await res.json().catch(() => ({}));
										throw new Error(data.error ?? "Sync failed");
									}
								} catch (err) {
									setInstructionsSyncError(
										err instanceof Error ? err.message : "Sync failed"
									);
								} finally {
									setInstructionsSyncLoading(false);
								}
							}}
						>
							{instructionsSyncLoading ? "Syncing…" : "Sync to Kinde"}
						</Button>
						<Button
							variant="secondary"
							disabled={instructionsSyncLoading}
							onClick={async () => {
								setInstructionsSyncError(null);
								setInstructionsSyncLoading(true);
								try {
									const res = await fetch("/api/user/ai-instructions");
									if (!res.ok) throw new Error("Load failed");
									const data = (await res.json()) as { instructions?: string };
									const value = typeof data.instructions === "string" ? data.instructions : "";
									setSettings({
										...settings,
										ai: { ...settings.ai, instructions: value },
									});
								} catch (err) {
									setInstructionsSyncError(
										err instanceof Error ? err.message : "Load failed"
									);
								} finally {
									setInstructionsSyncLoading(false);
								}
							}}
						>
							Load from Kinde
						</Button>
						{instructionsSyncError && (
							<span className="typescale-body-small text-red-600 dark:text-red-400">
								{instructionsSyncError}
							</span>
						)}
					</div>
				)}
				<div>
					<label
						htmlFor="ai-target-language"
						className="typescale-body-medium text-on-surface-variant mb-1 block"
					>
						{t("target_language")}
					</label>
					<Select
						id="ai-target-language"
						value={settings.ai?.targetLanguage ?? "English"}
						onChange={(e) => handleTargetLanguageChange(e.target.value)}
					>
						<option value="English">English</option>
						<option value="Spanish">Español</option>
						<option value="French">Français</option>
						<option value="German">Deutsch</option>
						<option value="Italian">Italiano</option>
						<option value="Portuguese">Português</option>
						<option value="Russian">Русский</option>
						<option value="Japanese">日本語</option>
						<option value="Korean">한국어</option>
						<option value="Chinese (Simplified)">简体中文</option>
						<option value="Chinese (Traditional)">繁體中文</option>
						<option value="Arabic">العربية</option>
						<option value="Hindi">हिन्दी</option>
						<option value="Dutch">Nederlands</option>
						<option value="Polish">Polski</option>
						<option value="Turkish">Türkçe</option>
						<option value="Vietnamese">Tiếng Việt</option>
						<option value="Thai">ไทย</option>
						<option value="Swedish">Svenska</option>
						<option value="Danish">Dansk</option>
						<option value="Norwegian">Norsk</option>
						<option value="Finnish">Suomi</option>
					</Select>
				</div>
			</div>
		</Item>
	);
};

const Synchronization: React.FC = () => {
	const cookies = parseCookies();
	const refreshToken = cookies[mapToToken["dropbox"]];
	const render = useForceRender();
	const t = useTranslation("settings.synchronization");

	useEventListener("message", (e) => {
		if (e.data === OAUTH_SUCCESS_MESSAGE) {
			// init app (generate access token, fetch remote data, etc.)
			window.location.reload();
		}
	});

	return (
		<Item title={t("title")}>
			<Select>
				<option value="dropbox">Dropbox</option>
			</Select>
			<div className="mt-2">
				{refreshToken ? (
					<Button
						variant="secondary"
						onClick={() => {
							destroyCookie(null, mapToToken["dropbox"]);
							render();
						}}
					>
						{t("unauthorize")}
					</Button>
				) : (
					<Button
						onClick={() => {
							const redirectUri =
								window.location.origin + "/api/callback/dropbox";

							dbx.auth
								.getAuthenticationUrl(
									redirectUri,
									JSON.stringify({ redirectUri }),
									"code",
									"offline",
								)
								.then((url) => {
									window.open(url as string, "_blank");
								});
						}}
					>
						{t("authorize")}
					</Button>
				)}
			</div>
		</Item>
	);
};

interface PartProps {
	title: string;
	children?: React.ReactNode;
}
const Item: React.FC<PartProps> = ({ title, children }) => {
	return (
		<div>
			<h3 className="typescale-title-small text-on-surface-variant">{title}</h3>
			<div className="mt-2">{children}</div>
		</div>
	);
};

Settings.displayName = "settings";
