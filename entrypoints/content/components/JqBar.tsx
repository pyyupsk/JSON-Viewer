import { suggest } from "../jq";
import { CopiedIcon, InvalidIcon, RunIcon } from "./Icons";

interface JqBarProps {
	expr: string;
	result: string | null;
	error: string | null;
	data: unknown;
	onExprChange: (v: string) => void;
	onRun: () => void;
	onEscape: () => void;
}

export function JqBar({
	expr,
	result,
	error,
	data,
	onExprChange,
	onRun,
	onEscape,
}: Readonly<JqBarProps>) {
	const hasStatus = result !== null || error !== null;
	const suffix = suggest(expr, data);

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Tab") {
			e.preventDefault();
			if (suffix) onExprChange(expr + suffix);
			return;
		}
		if (e.key === "Enter") onRun();
		if (e.key === "Escape") onEscape();
	}

	return (
		<div className="jqbar">
			<span className="jq-label">jq</span>
			<div className="jq-input-wrap">
				{suffix && (
					<span className="jq-ghost" aria-hidden>
						<span className="jq-ghost-typed">{expr}</span>
						<span className="jq-ghost-suffix">{suffix}</span>
					</span>
				)}
				<input
					className="jq-input"
					placeholder=". | .features, .author.name, .stats | {stars, forks}"
					value={expr}
					onChange={(e) => onExprChange(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
			</div>
			{hasStatus && (
				<span className={`jq-status ${error ? "err" : "ok"}`}>
					{error ? `${InvalidIcon} ${error}` : `${CopiedIcon} ok`}
				</span>
			)}
			<button type="button" className="jq-run" onClick={onRun}>
				{RunIcon} Run
			</button>
		</div>
	);
}
