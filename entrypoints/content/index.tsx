import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import styles from "./style.css?inline";

async function detectJson(): Promise<string | null> {
	if (document.contentType === "application/json")
		return document.body.innerText;

	if (
		document.contentType !== "text/plain" &&
		document.contentType !== "text/html"
	)
		return null;

	const raw = document.body?.innerText ?? "";
	if (raw.length > 5_000_000) return null;

	const trimmed = raw.trimStart();
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

	try {
		JSON.parse(raw);
		return raw;
	} catch {
		return null;
	}
}

export default defineContentScript({
	matches: ["*://*/*"],
	cssInjectionMode: "manual",
	runAt: "document_start",

	async main() {
		const mightBeJson =
			document.contentType === "application/json" ||
			document.contentType === "text/plain" ||
			document.contentType === "text/html";
		if (mightBeJson) document.documentElement.style.opacity = "0";

		if (document.readyState === "loading") {
			await new Promise<void>((resolve) =>
				document.addEventListener("DOMContentLoaded", () => resolve(), {
					once: true,
				}),
			);
		}

		const raw = await detectJson();

		if (!raw) {
			if (mightBeJson) document.documentElement.style.opacity = "1";
			return;
		}

		// Inject styles only on JSON pages
		const style = document.createElement("style");
		style.textContent = styles;
		document.head.appendChild(style);

		// Take over the page — remove all existing content and mount our viewer
		// opacity:0 here is a defensive guard: keeps the page hidden during DOM
		// manipulation in case the mightBeJson check above is ever narrowed and
		// the initial opacity:0 is no longer set before detectJson() runs.
		document.documentElement.style.cssText = "height:100%; opacity:0;";
		document.body.replaceChildren();
		document.body.style.cssText =
			"margin:0;padding:0;height:100%;overflow:hidden;";

		const container = document.createElement("div");
		container.style.cssText = "height:100%;";
		document.body.appendChild(container);

		ReactDOM.createRoot(container).render(
			<ErrorBoundary>
				<App rawJson={raw} />
			</ErrorBoundary>,
		);
		document.documentElement.style.opacity = "1";
	},
});
