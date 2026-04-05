import { getType, toStr, UNHANDLED } from "./helpers";
import { splitComma, splitPipe } from "./parser";
import { pathGet } from "./path";

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
	for (const entry of splitComma(inner)) {
		const trimmed = entry.trim();
		const colon = trimmed.indexOf(":");
		if (colon === -1) {
			const field = trimmed.replace(/^\./, "");
			o[field] = run(trimmed.startsWith(".") ? trimmed : `.${trimmed}`, data);
		} else {
			const k = trimmed.slice(0, colon).trim().replaceAll('"', "");
			o[k] = run(trimmed.slice(colon + 1).trim(), data);
		}
	}
	return o;
}

// ─── sub-evaluators ─────────────────────────────────────────────────────────

function evalStructural(expr: string, data: unknown): unknown {
	if (expr.includes("|")) {
		const parts = splitPipe(expr);
		return parts.reduce((acc: unknown, p: string) => run(p.trim(), acc), data);
	}

	if (expr === ".[]") {
		if (Array.isArray(data)) return data;
		if (typeof data === "object" && data)
			return Object.values(data as Record<string, unknown>);
		throw new Error("not iterable");
	}

	if (expr.startsWith("{") && expr.endsWith("}")) {
		return buildObj(expr.slice(1, -1).trim(), data);
	}

	if (expr.startsWith("[") && expr.endsWith("]")) {
		const inner = expr.slice(1, -1).trim();
		if (!inner) return [];
		return splitComma(inner).map((e) => run(e.trim(), data));
	}

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
	const selM = /^select\((.+)\)$/.exec(expr);
	if (selM) {
		const v = evalCond(selM[1], data);
		return v ? data : undefined;
	}

	const hasM = /^has\("(.+)"\)$/.exec(expr);
	if (hasM) return Object.hasOwn(data ?? {}, hasM[1]);

	const mapM = /^map\((.+)\)$/.exec(expr);
	if (mapM) {
		const arr = Array.isArray(data)
			? data
			: Object.values((data ?? {}) as object);
		return arr.map((i) => run(mapM[1], i)).filter((v) => v !== undefined);
	}

	const mvM = /^map_values\((.+)\)$/.exec(expr);
	if (mvM) return evalMapValues(mvM[1], data);

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
	const sbM = /^sort_by\((.+)\)$/i.exec(expr);
	if (sbM) return evalSortBy(sbM[1].trim().replace(/^\./, ""), data);

	const gbM = /^group_by\((.+)\)$/.exec(expr);
	if (gbM) return evalGroupBy(gbM[1].trim().replace(/^\./, ""), data);

	const ubM = /^unique_by\((.+)\)$/.exec(expr);
	if (ubM) return evalUniqueBy(ubM[1].trim().replace(/^\./, ""), data);

	const ltM = /^ltrimstr\("(.*)"\)$/.exec(expr);
	if (ltM)
		return toStr(data).startsWith(ltM[1])
			? toStr(data).slice(ltM[1].length)
			: data;

	const rtM = /^rtrimstr\("(.*)"\)$/.exec(expr);
	if (rtM)
		return toStr(data).endsWith(rtM[1])
			? toStr(data).slice(0, -rtM[1].length)
			: data;

	const spM = /^split\("(.*)"\)$/.exec(expr);
	if (spM) return toStr(data).split(spM[1]);

	const jnM = /^join\("(.*)"\)$/.exec(expr);
	if (jnM) return (Array.isArray(data) ? data : []).join(jnM[1]);

	return UNHANDLED;
}

function evalPathOrLiteral(expr: string, data: unknown): unknown {
	if (expr.startsWith(".")) return pathGet(expr.slice(1), data);
	if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
	if (!Number.isNaN(Number(expr)) && expr !== "") return Number(expr);
	if (expr === "true") return true;
	if (expr === "false") return false;
	if (expr === "null") return null;
	if (expr === "empty") return undefined;
	throw new Error(`Unknown: ${expr}`);
}

// ─── main entry point ────────────────────────────────────────────────────────

export function run(expr: string, data: unknown): unknown {
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
