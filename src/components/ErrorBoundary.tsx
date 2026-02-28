"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children?: ReactNode;
	/** Optional custom fallback UI. Receives error and reset callback. */
	fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): Partial<State> {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	private reset = () => {
		this.setState({ hasError: false, error: null });
	};

	public render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.reset);
			}
			return (
				<div className="bg-surface-container text-on-surface flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center">
					<p className="typescale-title-medium">Something went wrong</p>
					<p className="text-on-surface-variant typescale-body-small max-w-md">
						{this.state.error.message}
					</p>
					<button
						type="button"
						onClick={this.reset}
						className="bg-primary text-on-primary rounded px-4 py-2 typescale-label-large hover:opacity-90"
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
