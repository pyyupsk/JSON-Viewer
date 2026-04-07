import { BottomBar } from "@content/components/BottomBar";
import { JqBar } from "@content/components/JqBar";
import { JqResultView } from "@content/components/JqResultView";
import { MinifyView } from "@content/components/MinifyView";
import { RawView } from "@content/components/RawView";
import { SearchBar } from "@content/components/SearchBar";
import { Toast } from "@content/components/Toast";
import { TopBar } from "@content/components/TopBar";
import { TreeView } from "@content/components/TreeView";
import { TypeScriptView } from "@content/components/TypeScriptView";
import { useJqFilter } from "@content/hooks/useJqFilter";
import { useSearch } from "@content/hooks/useSearch";
import { useToast } from "@content/hooks/useToast";
import { collectObjectPaths, flattenData } from "@content/lib/flatten";
import { nameFromUrl } from "@content/lib/typescript";
import type { Tab } from "@content/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./style.css";

interface AppProps {
	readonly rawJson: string;
}

export function App({ rawJson }: AppProps) {
	// ── Parse ──────────────────────────────────────────────────────────────────
	const { data, parseError } = useMemo(() => {
		try {
			return { data: JSON.parse(rawJson) as unknown, parseError: null };
		} catch (e) {
			return { data: null, parseError: (e as Error).message };
		}
	}, [rawJson]);

	// ── State ──────────────────────────────────────────────────────────────────
	const [tab, setTab] = useState<Tab>("tree");
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const [selPath, setSelPath] = useState<string | null>(null);

	// ── Hooks ──────────────────────────────────────────────────────────────────
	const { toast, showToast } = useToast();

	const rows = useMemo(
		() => (data === null ? [] : flattenData(data, collapsed)),
		[data, collapsed],
	);

	const {
		searchQuery,
		caseSen,
		matchIdx,
		matches,
		matchSet,
		focusPath,
		setSearchQuery,
		setCaseSen,
		stepMatch,
	} = useSearch(rows);

	const { jqExpr, jqResult, jqError, setJqExpr, handleJqEval, handleJqEscape } =
		useJqFilter(data);

	// ── Derived ────────────────────────────────────────────────────────────────
	const rawStr = useMemo(
		() => JSON.stringify(data, null, 2) ?? rawJson,
		[data, rawJson],
	);
	const sizeKb = (rawJson.length / 1024).toFixed(1);
	const tsName = useMemo(() => nameFromUrl(globalThis.location.pathname), []);

	// ── Handlers ──────────────────────────────────────────────────────────────

	const getSelectedText = useCallback(() => {
		if (!selPath) return rawStr;
		const row = rows.find((r) => r.path === selPath);
		if (!row) return rawStr;
		if (row.kind === "open") return JSON.stringify(row.value, null, 2);
		if (row.kind === "prim") return String(row.value);
		return rawStr;
	}, [selPath, rows, rawStr]);

	// Global keyboard shortcuts
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey;

			if (mod && e.key === "f") {
				e.preventDefault();
				if (tab === "jq") setTab("tree");
				requestAnimationFrame(() => {
					(
						document.querySelector(".search-input") as HTMLInputElement | null
					)?.focus();
				});
				return;
			}

			if (mod && e.shiftKey && e.key === "C") {
				e.preventDefault();
				navigator.clipboard
					.writeText(getSelectedText())
					.then(() => showToast("Copied to clipboard"))
					.catch(() => showToast("Failed to copy"));
			}
		};
		globalThis.addEventListener("keydown", handler);
		return () => globalThis.removeEventListener("keydown", handler);
	}, [tab, getSelectedText, showToast]);

	const handleToggle = useCallback((path: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	}, []);

	const handleCollapseAll = useCallback(() => {
		setCollapsed(data === null ? new Set() : collectObjectPaths(data));
	}, [data]);

	const handleExpandAll = useCallback(() => setCollapsed(new Set()), []);

	const handleCopyAll = useCallback(() => {
		navigator.clipboard
			.writeText(rawStr)
			.then(() => showToast("Copied to clipboard"))
			.catch(() => showToast("Failed to copy"));
	}, [rawStr, showToast]);

	const handleCopyVal = useCallback(
		(val: unknown) => {
			const text =
				val !== null && typeof val === "object"
					? JSON.stringify(val, null, 2)
					: String(val as string | number | boolean | null | undefined);
			navigator.clipboard
				.writeText(text)
				.then(() => showToast("Copied to clipboard"))
				.catch(() => showToast("Failed to copy"));
		},
		[showToast],
	);

	const onJqEscape = useCallback(() => {
		handleJqEscape();
		setTab("tree");
	}, [handleJqEscape]);

	// ── Render ─────────────────────────────────────────────────────────────────

	const showJqResult = tab === "jq" && jqResult !== null;

	function renderContent() {
		if (parseError) {
			return (
				<textarea
					className="raw-area"
					readOnly
					value={rawJson}
					spellCheck={false}
				/>
			);
		}
		if (tab === "raw") return <RawView content={rawStr} />;
		if (tab === "minify") return <MinifyView data={data} />;
		if (tab === "ts") return <TypeScriptView data={data} name={tsName} />;
		if (showJqResult) return <JqResultView result={jqResult ?? ""} />;
		return (
			<TreeView
				rows={rows}
				selPath={selPath}
				matchSet={matchSet}
				focusPath={focusPath}
				onToggle={handleToggle}
				onSelect={setSelPath}
				onCopy={handleCopyVal}
			/>
		);
	}

	return (
		<div className="app">
			<TopBar
				tab={tab}
				onTabChange={setTab}
				onCollapseAll={handleCollapseAll}
				onExpandAll={handleExpandAll}
				onCopyAll={handleCopyAll}
			/>

			{tab === "jq" ? (
				<JqBar
					expr={jqExpr}
					result={jqResult}
					error={jqError}
					data={data}
					onExprChange={setJqExpr}
					onRun={handleJqEval}
					onEscape={onJqEscape}
				/>
			) : (
				<SearchBar
					query={searchQuery}
					caseSen={caseSen}
					matchIdx={matchIdx}
					matchCount={matches.length}
					onQueryChange={setSearchQuery}
					onCaseSenToggle={() => setCaseSen((v) => !v)}
					onStepMatch={stepMatch}
				/>
			)}

			<div className="viewer">{renderContent()}</div>

			<BottomBar
				valid={!parseError}
				sizeKb={sizeKb}
				lineCount={rows.length}
				selPath={selPath}
			/>

			<Toast message={toast} />
		</div>
	);
}
