import { useState } from "react";
import type { Row } from "../flatten";
import {
	CollapseNodeIcon,
	CopiedIcon,
	CopyIcon,
	ExpandNodeIcon,
} from "./Icons";

interface TreeRowProps {
	row: Row;
	lineNum: number;
	isSelected: boolean;
	isMatch: boolean;
	isFocus: boolean;
	onToggle: (path: string) => void;
	onSelect: (path: string) => void;
	onCopy: (val: unknown) => void;
}

export function TreeRow({
	row,
	lineNum,
	isSelected,
	isMatch,
	isFocus,
	onToggle,
	onSelect,
	onCopy,
}: Readonly<TreeRowProps>) {
	const [copied, setCopied] = useState(false);

	// For close rows, clicking selects the opening node
	const openPath =
		row.kind === "close" ? row.path.replace("__close", "") : row.path;

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (row.kind === "open" || row.kind === "prim") {
			onCopy(row.value);
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 1200);
	};

	const cls = [
		"row",
		isSelected && "sel",
		isMatch && "hit",
		isFocus && "hit-focus",
	]
		.filter(Boolean)
		.join(" ");

	const indentStyle = { "--depth": row.depth } as React.CSSProperties;

	return (
		<div
			className={cls}
			tabIndex={0}
			role="treeitem"
			aria-selected={isSelected}
			onClick={() => onSelect(openPath)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onSelect(openPath);
			}}
		>
			<div className="ln">{lineNum}</div>
			<div className="rc">
				<span className="ind" style={indentStyle} />
				{row.kind === "open" && <OpenContent row={row} onToggle={onToggle} />}
				{row.kind === "close" && <CloseContent row={row} />}
				{row.kind === "prim" && <PrimContent row={row} />}
			</div>
			{row.kind !== "close" && (
				<button
					type="button"
					className={`copy-btn${copied ? " ok" : ""}`}
					onClick={handleCopy}
				>
					{copied ? CopiedIcon : CopyIcon}
				</button>
			)}
		</div>
	);
}

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function OpenContent({
	row,
	onToggle,
}: Readonly<{
	row: Extract<Row, { kind: "open" }>;
	onToggle: (path: string) => void;
}>) {
	const open = row.type === "array" ? "[" : "{";
	const close = row.type === "array" ? "]" : "}";
	const label = `${row.count} ${row.type === "array" ? "items" : "keys"}`;

	return (
		<>
			<button
				type="button"
				className="tog"
				title={row.collapsed ? "Expand" : "Collapse"}
				onClick={(e) => {
					e.stopPropagation();
					onToggle(row.path);
				}}
			>
				{row.collapsed ? ExpandNodeIcon : CollapseNodeIcon}
			</button>
			{row.key !== null && (
				<>
					<span className="k">"{row.key}"</span>
					<span className="p">: </span>
				</>
			)}
			<span className="b">{open}</span>
			{row.collapsed && (
				<>
					<button
						type="button"
						className="pill"
						onClick={(e) => {
							e.stopPropagation();
							onToggle(row.path);
						}}
					>
						{label}
					</button>
					<span className="b">
						{close}
						{row.isLast ? "" : ","}
					</span>
				</>
			)}
		</>
	);
}

function CloseContent({
	row,
}: Readonly<{ row: Extract<Row, { kind: "close" }> }>) {
	const close = row.type === "array" ? "]" : "}";
	return (
		<>
			<span className="tog-space" />
			<span className="b">
				{close}
				{row.isLast ? "" : ","}
			</span>
		</>
	);
}

function PrimContent({
	row,
}: Readonly<{ row: Extract<Row, { kind: "prim" }> }>) {
	return (
		<>
			<span className="tog-space" />
			{row.key !== null && (
				<>
					<span className="k">"{row.key}"</span>
					<span className="p">: </span>
				</>
			)}
			{row.value === null && <span className="nl">null</span>}
			{typeof row.value === "string" && (
				<span className="s">"{row.value}"</span>
			)}
			{typeof row.value === "number" && <span className="n">{row.value}</span>}
			{row.value === true && <span className="t">true</span>}
			{row.value === false && <span className="f">false</span>}
			{!row.isLast && <span className="co">,</span>}
		</>
	);
}
