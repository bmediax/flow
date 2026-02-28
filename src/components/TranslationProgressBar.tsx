"use client";

import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import { useActiveTranslation, useTranslationError } from "../state";

export function TranslationProgressBar() {
	const [activeTranslation] = useActiveTranslation();
	const [translationError, setTranslationError] = useTranslationError();

	const percentage = activeTranslation
		? (activeTranslation.progress.current / activeTranslation.progress.total) *
			100
		: 0;

	// Update page title with translation progress
	useEffect(() => {
		if (activeTranslation) {
			document.title = `${Math.round(percentage)}% - Translating`;
		} else {
			document.title = "Reader";
		}

		// Cleanup: reset title when component unmounts
		return () => {
			document.title = "Reader";
		};
	}, [activeTranslation, percentage]);

	// Translation failed: show error bar with dismiss
	if (!activeTranslation && translationError) {
		return (
			<div className="fixed bottom-0 left-0 right-0 z-50">
				<div className="flex items-center justify-between gap-3 bg-red-100 px-4 py-2 text-red-800 typescale-body-small dark:bg-red-900/40 dark:text-red-200">
					<span className="min-w-0 flex-1">
						Translation failed: {translationError}
					</span>
					<button
						type="button"
						onClick={() => setTranslationError(null)}
						className="shrink-0 rounded p-1 hover:bg-red-500/20"
						aria-label="Dismiss"
					>
						<MdClose size={20} />
					</button>
				</div>
			</div>
		);
	}

	if (!activeTranslation) {
		return null;
	}

	const { progress, bookTitle } = activeTranslation;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50">
			<div className="bg-surface-container px-4 py-1 text-center typescale-body-small">
				<span className="text-on-surface">
					Translating &ldquo;{bookTitle}&rdquo; - {Math.round(percentage)}% (
					{progress.currentSection})
				</span>
			</div>
			<div className="h-1 w-full bg-surface-container">
				<div
					className="h-full bg-primary transition-all duration-300"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
