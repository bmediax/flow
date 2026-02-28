import type { RenditionSpread } from "@flow/epubjs/types/rendition";
import { atom, type SetStateAction, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const navbarAtom = atom<boolean>(false);

// Global translation state
export interface TranslationProgress {
	total: number;
	current: number;
	currentSection: string;
}

export interface TranslationJob {
	bookId: string;
	bookTitle: string;
	progress: TranslationProgress;
	startTime: number;
}

export const activeTranslationAtom = atom<TranslationJob | null>(null);

/** Last translation error message; shown until user dismisses or starts a new translation. */
export const translationErrorAtom = atom<string | null>(null);

export function useActiveTranslation(): [
	TranslationJob | null,
	(update: SetStateAction<TranslationJob | null>) => void,
] {
	return useAtom(activeTranslationAtom);
}

export function useTranslationError(): [
	string | null,
	(error: string | null) => void,
] {
	return useAtom(translationErrorAtom);
}

export interface Settings extends TypographyConfiguration {
	theme?: ThemeConfiguration;
	enableTextSelectionMenu?: boolean;
	ai?: AIConfiguration;
}

export type AIProvider = "anthropic" | "openai";

export interface AIConfiguration {
	provider?: AIProvider;
	apiToken?: string; // Encrypted API token
	model?: string;
	instructions?: string;
	targetLanguage?: string; // Target language for translation
}

/** Provider display names only; models are loaded dynamically per API key. */
export const AI_PROVIDERS: Record<AIProvider, { name: string }> = {
	anthropic: { name: "Anthropic" },
	openai: { name: "OpenAI" },
};

export interface TypographyConfiguration {
	fontSize?: string;
	fontWeight?: number;
	fontFamily?: string;
	lineHeight?: number;
	spread?: RenditionSpread;
	zoom?: number;
}

interface ThemeConfiguration {
	source?: string;
	background?: number;
}

export const defaultSettings: Settings = {};

const settingsAtom = atomWithStorage<Settings>("settings", defaultSettings);

export function useSettings() {
	return useAtom(settingsAtom);
}
