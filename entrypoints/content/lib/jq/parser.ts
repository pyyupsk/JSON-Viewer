import { updateDepth } from "./helpers";

export function splitOn(expr: string, sep: string): string[] {
	const parts: string[] = [];
	let depth = 0,
		str = false,
		buf = "";
	for (let i = 0; i < expr.length; i++) {
		const c = expr[i];
		if (c === '"' && expr[i - 1] !== "\\") str = !str;
		if (!str) depth = updateDepth(c, depth);
		if (!str && depth === 0 && c === sep) {
			parts.push(buf);
			buf = "";
		} else buf += c;
	}
	parts.push(buf);
	return parts;
}

export function splitPipe(expr: string): string[] {
	return splitOn(expr, "|");
}

export function splitComma(expr: string): string[] {
	return splitOn(expr, ",");
}
