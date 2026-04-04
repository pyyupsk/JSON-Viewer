import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BottomBar } from "./components/BottomBar";
import { JqBar } from "./components/JqBar";
import { JqResultView } from "./components/JqResultView";
import { MinifyView } from "./components/MinifyView";
import { RawView } from "./components/RawView";
import { SearchBar } from "./components/SearchBar";
import { Toast } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { TreeView } from "./components/TreeView";
import { flattenData, rowSearchText } from "./flatten";
import { jq } from "./jq";
import "./style.css";

type Tab = "tree" | "raw" | "minify" | "jq";

interface AppProps {
	rawJson: string;
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
	const [searchQuery, setSearchQuery] = useState("");
	const [caseSen, setCaseSen] = useState(false);
	const [matchIdx, setMatchIdx] = useState(-1);
	const [jqExpr, setJqExpr] = useState("");
	const [jqResult, setJqResult] = useState<string | null>(null);
	const [jqError, setJqError] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// ── Derived ────────────────────────────────────────────────────────────────
	const rows = useMemo(
		() => (data !== null ? flattenData(data, collapsed) : []),
		[data, collapsed],
	);

	const matches = useMemo<string[]>(() => {
		if (!searchQuery) return [];
		const q = caseSen ? searchQuery : searchQuery.toLowerCase();
		return rows
			.filter((row) => {
				const text = caseSen
					? rowSearchText(row)
					: rowSearchText(row).toLowerCase();
				return text.includes(q);
			})
			.map((row) => row.path);
	}, [rows, searchQuery, caseSen]);

	const matchSet = useMemo(() => new Set(matches), [matches]);
	const focusPath = matches[matchIdx] ?? null;

	const rawStr = useMemo(
		() => JSON.stringify(data, null, 2) ?? rawJson,
		[data, rawJson],
	);
	const sizeKb = (rawJson.length / 1024).toFixed(1);

	// ── Handlers ── (showToast declared early; used in keyboard shortcut effect below) ──

	const showToast = useCallback((msg: string) => {
		setToast(msg);
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToast(null), 1800);
	}, []);

	// ── Effects ────────────────────────────────────────────────────────────────

	// Reset match index when search results change
	useEffect(() => {
		setMatchIdx(matches.length > 0 ? 0 : -1);
	}, [matches]);

	// Scroll focused match into view
	useEffect(() => {
		if (focusPath) {
			document.querySelector(".row.hit-focus")?.scrollIntoView({
				block: "center",
				behavior: "smooth",
			});
		}
	}, [focusPath]);

	// Global keyboard shortcuts
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey;

			// Ctrl/Cmd+F → focus search
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

			// Ctrl/Cmd+Shift+C → copy selected node or full JSON
			if (mod && e.shiftKey && e.key === "C") {
				e.preventDefault();
				const text = selPath
					? (() => {
							const row = rows.find((r) => r.path === selPath);
							if (!row) return rawStr;
							if (row.kind === "open")
								return JSON.stringify(row.value, null, 2);
							if (row.kind === "prim") return String(row.value);
							return rawStr;
						})()
					: rawStr;
				navigator.clipboard.writeText(text).catch(() => {});
				showToast("Copied to clipboard");
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [tab, selPath, rows, rawStr, showToast]);

	// ── Remaining handlers ────────────────────────────────────────────────────

	const handleToggle = useCallback((path: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	}, []);

	const handleCollapseAll = useCallback(() => {
		const paths = new Set<string>();
		function walk(val: unknown, path: string) {
			if (val !== null && typeof val === "object") {
				paths.add(path);
				const isArr = Array.isArray(val);
				const keys = isArr
					? (val as unknown[]).map((_, i) => String(i))
					: Object.keys(val as Record<string, unknown>);
				for (const k of keys) {
					walk(
						isArr
							? (val as unknown[])[Number(k)]
							: (val as Record<string, unknown>)[k],
						isArr ? `${path}[${k}]` : `${path}.${k}`,
					);
				}
			}
		}
		if (data !== null) walk(data, "root");
		setCollapsed(paths);
	}, [data]);

	const handleExpandAll = useCallback(() => setCollapsed(new Set()), []);

	const handleCopyAll = useCallback(() => {
		navigator.clipboard.writeText(rawStr).catch(() => {});
		showToast("Copied to clipboard");
	}, [rawStr, showToast]);

	const handleCopyVal = useCallback((val: unknown) => {
		const text =
			typeof val === "object" && val !== null
				? JSON.stringify(val, null, 2)
				: String(val);
		navigator.clipboard.writeText(text).catch(() => {});
	}, []);

	const stepMatch = useCallback(
		(dir: 1 | -1) => {
			if (!matches.length) return;
			setMatchIdx((prev) => (prev + dir + matches.length) % matches.length);
		},
		[matches],
	);

	const handleJqEval = useCallback(() => {
		const expr = jqExpr.trim();
		if (!expr || expr === ".") {
			setJqResult(null);
			setJqError(null);
			return;
		}
		try {
			const result = jq.run(expr, data);
			setJqResult(JSON.stringify(result, null, 2));
			setJqError(null);
		} catch (e) {
			setJqError((e as Error).message);
			setJqResult(null);
		}
	}, [jqExpr, data]);

	const handleJqEscape = useCallback(() => {
		setJqExpr("");
		setJqResult(null);
		setJqError(null);
		setTab("tree");
	}, []);

	// ── Render ─────────────────────────────────────────────────────────────────

	const showJqResult = tab === "jq" && jqResult !== null;

	return (
		<div className="app">
			<TopBar
				tab={tab}
				onTabChange={setTab}
				onCollapseAll={handleCollapseAll}
				onExpandAll={handleExpandAll}
				onCopyAll={handleCopyAll}
			/>

			{tab !== "jq" ? (
				<SearchBar
					query={searchQuery}
					caseSen={caseSen}
					matchIdx={matchIdx}
					matchCount={matches.length}
					onQueryChange={setSearchQuery}
					onCaseSenToggle={() => setCaseSen((v) => !v)}
					onStepMatch={stepMatch}
				/>
			) : (
				<JqBar
					expr={jqExpr}
					result={jqResult}
					error={jqError}
					onExprChange={setJqExpr}
					onRun={handleJqEval}
					onEscape={handleJqEscape}
				/>
			)}

			<div className="viewer">
				{parseError ? (
					<textarea
						className="raw-area"
						readOnly
						value={rawJson}
						spellCheck={false}
					/>
				) : tab === "raw" ? (
					<RawView content={rawStr} />
				) : tab === "minify" ? (
					<MinifyView data={data} />
				) : showJqResult ? (
					<JqResultView result={jqResult || ""} />
				) : (
					<TreeView
						rows={rows}
						selPath={selPath}
						matchSet={matchSet}
						focusPath={focusPath}
						onToggle={handleToggle}
						onSelect={setSelPath}
						onCopy={handleCopyVal}
					/>
				)}
			</div>

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
