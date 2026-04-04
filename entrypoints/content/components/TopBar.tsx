import { CollapseIcon, CopyIcon, ExpandIcon } from "./Icons";

type Tab = "tree" | "raw" | "minify" | "jq";

interface TopBarProps {
	tab: Tab;
	onTabChange: (tab: Tab) => void;
	onCollapseAll: () => void;
	onExpandAll: () => void;
	onCopyAll: () => void;
}

export function TopBar({
	tab,
	onTabChange,
	onCollapseAll,
	onExpandAll,
	onCopyAll,
}: Readonly<TopBarProps>) {
	return (
		<div className="topbar">
			<span className="logo">{"{ }"} json</span>
			<div className="sep" />
			<div className="tab-group">
				<button
					type="button"
					className={`tab${tab === "tree" ? " on" : ""}`}
					onClick={() => onTabChange("tree")}
				>
					Tree
				</button>
				<button
					type="button"
					className={`tab${tab === "raw" ? " on" : ""}`}
					onClick={() => onTabChange("raw")}
				>
					Raw
				</button>
				<button
					type="button"
					className={`tab${tab === "minify" ? " on" : ""}`}
					onClick={() => onTabChange("minify")}
				>
					Minify
				</button>
			</div>
			<div className="sep" />
			<button
				type="button"
				className={`tab${tab === "jq" ? " on" : ""}`}
				style={{ color: "var(--accent)" }}
				onClick={() => onTabChange("jq")}
			>
				jq
			</button>
			<div className="spacer" />
			<button type="button" className="top-action" onClick={onCollapseAll}>
				{CollapseIcon} Collapse
			</button>
			<button type="button" className="top-action" onClick={onExpandAll}>
				{ExpandIcon} Expand
			</button>
			<div className="sep" />
			<button type="button" className="top-action primary" onClick={onCopyAll}>
				{CopyIcon} Copy
			</button>
		</div>
	);
}
