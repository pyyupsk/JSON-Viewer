import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("[JSON Viewer] Render error:", error, info.componentStack);
	}

	render() {
		if (this.state.error) {
			return (
				<div className="error-boundary">
					<strong>JSON Viewer encountered an error.</strong>
					<pre>{this.state.error.message}</pre>
				</div>
			);
		}
		return this.props.children;
	}
}
