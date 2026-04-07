import { updateDepth } from "./helpers";

export function isUnescapedQuote(expr: string, i: number): boolean {
	let backslashCount = 0;
	for (let j = i - 1; j >= 0 && expr[j] === "\\"; j--) {
		backslashCount++;
	}
	return backslashCount % 2 === 0;
}

function updateKwDepth(
	expr: string,
	i: number,
	depth: number,
	kwDepth: number,
): number {
	if (depth !== 0) return kwDepth;
	const isIfStart =
		expr.slice(i, i + 3) === "if " && (i === 0 || /[\s|,(]/.test(expr[i - 1]));
	if (isIfStart) return kwDepth + 1;
	const isEnd =
		expr.slice(i, i + 3) === "end" &&
		(i + 3 >= expr.length || /[\s|,)]/.test(expr[i + 3]));
	if (isEnd) return Math.max(0, kwDepth - 1);
	return kwDepth;
}

export function splitOn(expr: string, sep: string): string[] {
	const parts: string[] = [];
	let depth = 0,
		kwDepth = 0,
		str = false,
		buf = "";
	for (let i = 0; i < expr.length; i++) {
		const c = expr[i];
		if (c === '"' && isUnescapedQuote(expr, i)) str = !str;
		if (!str) {
			depth = updateDepth(c, depth);
			kwDepth = updateKwDepth(expr, i, depth, kwDepth);
		}
		if (!str && depth === 0 && kwDepth === 0 && c === sep) {
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
