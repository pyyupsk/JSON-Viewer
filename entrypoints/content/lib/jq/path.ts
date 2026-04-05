function parseKeyToken(path: string, i: number): { val: string; next: number } {
	const dot = path.indexOf(".", i);
	const bracket = path.indexOf("[", i);
	let end = path.length;
	if (dot !== -1 && dot < end) end = dot;
	if (bracket !== -1 && bracket < end) end = bracket;
	const next = path[end] === "." ? end + 1 : end;
	return { val: path.slice(i, end), next };
}

function parsePathTokens(
	path: string,
): Array<{ type: "idx" | "key"; val: string }> {
	const tokens: Array<{ type: "idx" | "key"; val: string }> = [];
	let i = 0;
	while (i < path.length) {
		if (path[i] === "[") {
			const close = path.indexOf("]", i);
			if (close === -1) {
				throw new Error("Unclosed '[' in path");
			}
			tokens.push({ type: "idx", val: path.slice(i + 1, close) });
			i = close + 1;
			if (path[i] === ".") i++;
		} else {
			const { val, next } = parseKeyToken(path, i);
			if (val) tokens.push({ type: "key", val });
			i = next;
		}
	}
	return tokens;
}

function resolveToken(
	t: { type: "idx" | "key"; val: string },
	cur: unknown,
): unknown {
	if (t.type !== "idx") return (cur as Record<string, unknown>)[t.val];
	if (t.val === "") {
		return Array.isArray(cur) ? cur : Object.values(cur as object);
	}
	const idx = Number.isNaN(Number(t.val))
		? t.val.replaceAll('"', "")
		: Number(t.val);
	return (cur as Record<string | number, unknown>)[idx];
}

export function pathGet(path: string, data: unknown): unknown {
	if (!path) return data;
	let cur = data;
	for (const t of parsePathTokens(path)) {
		if (cur == null) return null;
		cur = resolveToken(t, cur);
	}
	return cur ?? null;
}
