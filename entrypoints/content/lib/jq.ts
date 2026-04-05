const UNHANDLED = {} as const;

function toStr(v: unknown): string {
	if (typeof v === "string") return v;
	if (v !== null && typeof v === "object") return JSON.stringify(v);
	return String(v as number | boolean | null | undefined);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getType(data: unknown): string {
	if (Array.isArray(data)) return "array";
	if (data === null) return "null";
	return typeof data;
}

function updateDepth(c: string, depth: number): number {
	if ("([{".includes(c)) return depth + 1;
	if (")]}".includes(c)) return depth - 1;
	return depth;
}

function splitOn(expr: string, sep: string): string[] {
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

function splitPipe(expr: string): string[] {
	return splitOn(expr, "|");
}

function splitComma(expr: string): string[] {
	return splitOn(expr, ",");
}

function evalLength(data: unknown): number {
	if (Array.isArray(data)) return data.length;
	if (typeof data === "string") return data.length;
	if (typeof data === "object" && data) return Object.keys(data).length;
	return 0;
}

function evalFromEntries(data: unknown): Record<string, unknown> {
	const o: Record<string, unknown> = {};
	for (const e of (data ?? []) as Array<{
		key?: string;
		name?: string;
		value: unknown;
	}>) {
		o[e.key ?? e.name ?? ""] = e.value;
	}
	return o;
}

function evalAdd(data: unknown): unknown {
	if (!Array.isArray(data)) return null;
	if (data.length === 0) return null;
	const [first, ...rest] = data as unknown[];
	return rest.reduce((a: unknown, b: unknown) => {
		if (typeof a === "number" && typeof b === "number") return a + b;
		if (typeof a === "string") return a + toStr(b);
		if (Array.isArray(a) && Array.isArray(b))
			return (a as unknown[]).concat(b as unknown[]);
		if (typeof a === "object" && a && typeof b === "object" && b)
			return Object.assign(a, b);
		return b;
	}, first);
}

function evalRecurse(data: unknown): unknown[] {
	const out: unknown[] = [];
	const stack: unknown[] = [data];
	while (stack.length > 0) {
		const v: unknown = stack.pop();
		out.push(v);
		if (Array.isArray(v)) {
			for (let i = v.length - 1; i >= 0; i--) stack.push(v[i]);
		} else if (v && typeof v === "object") {
			const vals = Object.values(v);
			for (let i = vals.length - 1; i >= 0; i--) stack.push(vals[i]);
		}
	}
	return out;
}

function evalSortBy(field: string, data: unknown): unknown[] {
	return [...(Array.isArray(data) ? data : [])].sort((a, b) => {
		const av = (a as Record<string, unknown>)[field] as string | number;
		const bv = (b as Record<string, unknown>)[field] as string | number;
		if (av < bv) return -1;
		if (av > bv) return 1;
		return 0;
	});
}

function evalGroupBy(field: string, data: unknown): unknown[] {
	const groups: Record<string, unknown[]> = {};
	for (const item of Array.isArray(data) ? data : []) {
		const k = toStr((item as Record<string, unknown>)[field]);
		if (!groups[k]) groups[k] = [];
		groups[k].push(item);
	}
	return Object.values(groups);
}

function evalUniqueBy(field: string, data: unknown): unknown[] {
	const seen = new Set<string>();
	return (Array.isArray(data) ? data : []).filter((item) => {
		const k = toStr((item as Record<string, unknown>)[field]);
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}

function evalMapValues(subExpr: string, data: unknown): unknown {
	if (Array.isArray(data)) return data.map((i) => run(subExpr, i));
	const o: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(
		(data ?? {}) as Record<string, unknown>,
	)) {
		o[k] = run(subExpr, v);
	}
	return o;
}

// ─── path helpers ───────────────────────────────────────────────────────────

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

// ─── sub-evaluators ─────────────────────────────────────────────────────────

function evalStructural(expr: string, data: unknown): unknown {
	// pipe
	if (expr.includes("|")) {
		const parts = splitPipe(expr);
		return parts.reduce((acc: unknown, p: string) => run(p.trim(), acc), data);
	}

	// array iter
	if (expr === ".[]") {
		if (Array.isArray(data)) return data;
		if (typeof data === "object" && data)
			return Object.values(data as Record<string, unknown>);
		throw new Error("not iterable");
	}

	// construct object { a, b.c as b }
	if (expr.startsWith("{") && expr.endsWith("}")) {
		return buildObj(expr.slice(1, -1).trim(), data);
	}

	// construct array [ ... ]
	if (expr.startsWith("[") && expr.endsWith("]")) {
		const inner = expr.slice(1, -1).trim();
		if (!inner) return [];
		return splitComma(inner).map((e) => run(e.trim(), data));
	}

	// comma-separated → array of results
	const commas = splitComma(expr);
	if (commas.length > 1) return commas.map((e) => run(e.trim(), data));

	return UNHANDLED;
}

function evalKeyword(expr: string, data: unknown): unknown {
	if (expr === "not") return !data;
	if (expr === "keys") return Object.keys((data ?? {}) as object);
	if (expr === "values") return Object.values((data ?? {}) as object);
	if (expr === "length") return evalLength(data);
	if (expr === "type") return getType(data);
	if (expr === "to_entries")
		return Object.entries((data ?? {}) as Record<string, unknown>).map(
			([k, v]) => ({ key: k, value: v }),
		);
	if (expr === "from_entries") return evalFromEntries(data);
	if (expr === "add") return evalAdd(data);
	if (expr === "recurse" || expr === "..") return evalRecurse(data);
	if (expr === "ascii_downcase") return toStr(data).toLowerCase();
	if (expr === "ascii_upcase") return toStr(data).toUpperCase();
	if (expr === "tostring") return toStr(data);
	if (expr === "tonumber") return Number(data);
	return UNHANDLED;
}

function evalFuncExpr(expr: string, data: unknown): unknown {
	// select()
	const selM = /^select\((.+)\)$/.exec(expr);
	if (selM) {
		const v = evalCond(selM[1], data);
		return v ? data : undefined;
	}

	// has()
	const hasM = /^has\("(.+)"\)$/.exec(expr);
	if (hasM) return Object.hasOwn(data ?? {}, hasM[1]);

	// map()
	const mapM = /^map\((.+)\)$/.exec(expr);
	if (mapM) {
		const arr = Array.isArray(data)
			? data
			: Object.values((data ?? {}) as object);
		return arr.map((i) => run(mapM[1], i)).filter((v) => v !== undefined);
	}

	// map_values()
	const mvM = /^map_values\((.+)\)$/.exec(expr);
	if (mvM) return evalMapValues(mvM[1], data);

	// if-then-else
	const ifM = /^if\s+(.+?)\s+then\s+(.+?)(?:\s+else\s+(.+?))?\s+end$/.exec(
		expr,
	);
	if (ifM) {
		const cond = evalCond(ifM[1], data);
		return run(cond ? ifM[2] : (ifM[3] ?? "."), data);
	}

	return UNHANDLED;
}

function evalPatternOp(expr: string, data: unknown): unknown {
	// sort_by()
	const sbM = /^sort_by\((.+)\)$/i.exec(expr);
	if (sbM) return evalSortBy(sbM[1].trim().replace(/^\./, ""), data);

	// group_by()
	const gbM = /^group_by\((.+)\)$/.exec(expr);
	if (gbM) return evalGroupBy(gbM[1].trim().replace(/^\./, ""), data);

	// unique_by()
	const ubM = /^unique_by\((.+)\)$/.exec(expr);
	if (ubM) return evalUniqueBy(ubM[1].trim().replace(/^\./, ""), data);

	// ltrimstr()
	const ltM = /^ltrimstr\("(.*)"\)$/.exec(expr);
	if (ltM)
		return toStr(data).startsWith(ltM[1])
			? toStr(data).slice(ltM[1].length)
			: data;

	// rtrimstr()
	const rtM = /^rtrimstr\("(.*)"\)$/.exec(expr);
	if (rtM)
		return toStr(data).endsWith(rtM[1])
			? toStr(data).slice(0, -rtM[1].length)
			: data;

	// split()
	const spM = /^split\("(.*)"\)$/.exec(expr);
	if (spM) return toStr(data).split(spM[1]);

	// join()
	const jnM = /^join\("(.*)"\)$/.exec(expr);
	if (jnM) return (Array.isArray(data) ? data : []).join(jnM[1]);

	return UNHANDLED;
}

function evalPathOrLiteral(expr: string, data: unknown): unknown {
	// .key.sub.path and .key[0].sub
	if (expr.startsWith(".")) return pathGet(expr.slice(1), data);

	// string literal
	if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);

	// number literal
	if (!Number.isNaN(Number(expr)) && expr !== "") return Number(expr);

	// boolean / null / empty
	if (expr === "true") return true;
	if (expr === "false") return false;
	if (expr === "null") return null;
	if (expr === "empty") return undefined;

	throw new Error(`Unknown: ${expr}`);
}

// ─── main entry point ────────────────────────────────────────────────────────

function run(expr: string, data: unknown): unknown {
	expr = expr.trim();
	if (!expr || expr === ".") return data;
	const r1 = evalStructural(expr, data);
	if (r1 !== UNHANDLED) return r1;
	const r2 = evalKeyword(expr, data);
	if (r2 !== UNHANDLED) return r2;
	const r3 = evalFuncExpr(expr, data);
	if (r3 !== UNHANDLED) return r3;
	const r4 = evalPatternOp(expr, data);
	if (r4 !== UNHANDLED) return r4;
	return evalPathOrLiteral(expr, data);
}

// ─── path resolution ─────────────────────────────────────────────────────────

function pathGet(path: string, data: unknown): unknown {
	if (!path) return data;
	let cur = data;
	for (const t of parsePathTokens(path)) {
		if (cur == null) return null;
		cur = resolveToken(t, cur);
	}
	return cur ?? null;
}

// ─── condition evaluator ─────────────────────────────────────────────────────

function evalCond(expr: string, data: unknown): boolean {
	const cmp = /^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/.exec(expr);
	if (cmp) {
		const lv = run(cmp[1].trim(), data);
		let rv: unknown = cmp[3].trim();
		if ((rv as string).startsWith('"')) rv = (rv as string).slice(1, -1);
		else if (rv === "true") rv = true;
		else if (rv === "false") rv = false;
		else if (rv === "null") rv = null;
		else if (!Number.isNaN(Number(rv as string))) rv = Number(rv as string);
		switch (cmp[2]) {
			case "==":
				return toStr(lv) === toStr(rv) || lv === rv;
			case "!=":
				return toStr(lv) !== toStr(rv) && lv !== rv;
			case ">":
				return (lv as number) > (rv as number);
			case "<":
				return (lv as number) < (rv as number);
			case ">=":
				return (lv as number) >= (rv as number);
			case "<=":
				return (lv as number) <= (rv as number);
		}
	}
	return !!run(expr, data);
}

// ─── object builder ──────────────────────────────────────────────────────────

function buildObj(inner: string, data: unknown): unknown {
	const o: Record<string, unknown> = {};
	splitComma(inner).forEach((entry) => {
		entry = entry.trim();
		const colon = entry.indexOf(":");
		if (colon === -1) {
			const field = entry.replace(/^\./, "");
			o[field] = run(entry.startsWith(".") ? entry : `.${entry}`, data);
		} else {
			const k = entry.slice(0, colon).trim().replaceAll('"', "");
			o[k] = run(entry.slice(colon + 1).trim(), data);
		}
	});
	return o;
}

// ─── auto-complete ────────────────────────────────────────────────────────────

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

export const jq = { run };
