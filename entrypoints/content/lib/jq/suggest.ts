import { run } from "./evaluator";

const BUILTINS: string[] = [
	"map(",
	"select(",
	"sort_by(",
	"group_by(",
	"unique_by(",
	"has(",
	"map_values(",
	"split(",
	"join(",
	"ltrimstr(",
	"rtrimstr(",
	"if ",
	"keys",
	"values",
	"length",
	"type",
	"add",
	"recurse",
	"to_entries",
	"from_entries",
	"ascii_downcase",
	"ascii_upcase",
	"tostring",
	"tonumber",
	"not",
	"empty",
	"..",
];

export function suggest(expr: string, data: unknown): string {
	if (!expr) return "";

	// Key completion: triggered when expr starts with "." and the last pipe segment also starts with "."
	const lastPipeSegment = expr.includes("|")
		? expr.slice(expr.lastIndexOf("|") + 1).trim()
		: expr;
	if (expr.startsWith(".") && lastPipeSegment.startsWith(".")) {
		const lastDot = expr.lastIndexOf(".");
		const prefix = expr.slice(0, lastDot) || ".";
		const partial = expr.slice(lastDot + 1);

		let ctx: unknown;
		try {
			ctx = run(prefix, data);
		} catch {
			return "";
		}

		if (ctx !== null && typeof ctx === "object" && !Array.isArray(ctx)) {
			const keys = Object.keys(ctx as Record<string, unknown>);
			const match = keys.find((k) => k.startsWith(partial) && k !== partial);
			if (match) return match.slice(partial.length);
		}
		return "";
	}

	// Builtin completion: extract last token after |, ,, (, or space
	const tokenMatch = /(?:^|[|,(\s])([^\s|,(]*)$/.exec(expr);
	const token = tokenMatch ? tokenMatch[1] : expr;
	if (!token) return "";

	const match = BUILTINS.find((b) => b.startsWith(token) && b !== token);
	return match ? match.slice(token.length) : "";
}
