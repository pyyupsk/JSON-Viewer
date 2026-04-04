// ─── helpers ─────────────────────────────────────────────────────────────────

function toPascalCase(s: string): string {
	return s
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join("");
}

function toSingular(name: string): string {
	if (name.length > 1 && name.endsWith("s")) return name.slice(0, -1);
	return `${name}Item`;
}

export function nameFromUrl(pathname: string): string {
	const segments = pathname.split("/").filter(Boolean);
	const last = [...segments].reverse().find((s) => !/^\d+$/.test(s));
	return last ? toPascalCase(last) : "Root";
}

// ─── generator context ────────────────────────────────────────────────────────

interface Ctx {
	inline: boolean;
	extracted: Map<string, string>; // name → body lines
	root: unknown;
}

// ─── null inference ───────────────────────────────────────────────────────────

function findKeyInDoc(key: string, node: unknown): unknown {
	if (node === null || typeof node !== "object") return undefined;
	if (Array.isArray(node)) {
		for (const item of node) {
			const found = findKeyInDoc(key, item);
			if (found !== undefined) return found;
		}
		return undefined;
	}
	const obj = node as Record<string, unknown>;
	if (key in obj && obj[key] !== null) return obj[key];
	for (const v of Object.values(obj)) {
		const found = findKeyInDoc(key, v);
		if (found !== undefined) return found;
	}
	return undefined;
}

function inferNull(key: string, ctx: Ctx, siblings: unknown[]): string {
	// 1. sibling items in the same array
	for (const sib of siblings) {
		if (sib !== null && typeof sib === "object" && !Array.isArray(sib)) {
			const val = (sib as Record<string, unknown>)[key];
			if (val !== undefined && val !== null) {
				return `${inferValue(val, key, ctx, [])} | null`;
			}
		}
	}
	// 2. same key elsewhere in the document
	const found = findKeyInDoc(key, ctx.root);
	if (found !== undefined) {
		return `${inferValue(found, key, ctx, [])} | null`;
	}
	return "null";
}

// ─── name allocation ──────────────────────────────────────────────────────────

function allocateName(base: string, body: string, ctx: Ctx): string {
	// Reuse existing extracted type if same body
	for (const [name, existing] of ctx.extracted) {
		if (existing === body) return name;
	}
	// Find a unique name
	let name = base;
	let n = 2;
	while (ctx.extracted.has(name)) name = `${base}${n++}`;
	ctx.extracted.set(name, body);
	return name;
}

// ─── object shape ─────────────────────────────────────────────────────────────

function inferObjectShape(
	objects: Record<string, unknown>[],
	_parentKey: string,
	ctx: Ctx,
): string {
	const allKeys = new Set(objects.flatMap((o) => Object.keys(o)));
	const lines: string[] = [];

	for (const key of allKeys) {
		const presentIn = objects.filter((o) => key in o);
		const optional = presentIn.length < objects.length;
		const values = presentIn.map((o) => o[key]);

		const nonNull = values.filter((v) => v !== null);
		const hasNull = values.some((v) => v === null);

		let type: string;
		if (nonNull.length === 0) {
			type = inferNull(key, ctx, objects);
		} else {
			const types = [
				...new Set(nonNull.map((v) => inferValue(v, key, ctx, objects))),
			];
			type = types.length === 1 ? types[0] : types.join(" | ");
			if (hasNull) type = `${type} | null`;
		}

		// Mark optional if missing from some items OR if it has null values alongside non-null values
		const effectivelyOptional = optional || (hasNull && nonNull.length > 0);
		lines.push(`  ${key}${effectivelyOptional ? "?" : ""}: ${type}`);
	}

	return lines.join("\n");
}

// ─── value inference ──────────────────────────────────────────────────────────

function inferValue(
	value: unknown,
	key: string,
	ctx: Ctx,
	siblings: unknown[],
): string {
	if (value === null) return inferNull(key, ctx, siblings);
	if (typeof value === "string") return "string";
	if (typeof value === "number") return "number";
	if (typeof value === "boolean") return "boolean";

	if (Array.isArray(value)) {
		if (value.length === 0) return "unknown[]";

		const objs = value.filter(
			(x) => x !== null && typeof x === "object" && !Array.isArray(x),
		) as Record<string, unknown>[];

		const prims = value.filter(
			(x) => x === null || typeof x !== "object" || Array.isArray(x),
		);

		const types: string[] = [];

		if (objs.length > 0) {
			const body = inferObjectShape(objs, key, ctx);
			if (ctx.inline) {
				types.push(`{\n${body}\n}`);
			} else {
				const name = allocateName(toPascalCase(key), body, ctx);
				types.push(name);
			}
		}

		for (const p of prims) {
			const t = inferValue(p, key, ctx, value);
			if (!types.includes(t)) types.push(t);
		}

		const unique = [...new Set(types)];
		return unique.length === 1 ? `${unique[0]}[]` : `(${unique.join(" | ")})[]`;
	}

	// Object
	const obj = value as Record<string, unknown>;
	const body = inferObjectShape([obj], key, ctx);
	if (ctx.inline) return `{\n${body}\n}`;
	const name = allocateName(toPascalCase(key), body, ctx);
	return name;
}

// ─── public API ───────────────────────────────────────────────────────────────

export function jsonToTs(
	data: unknown,
	rootName: string,
	inline: boolean,
): string {
	const ctx: Ctx = { inline, extracted: new Map(), root: data };

	let rootTs: string;

	if (data === null) {
		rootTs = "null";
	} else if (Array.isArray(data)) {
		if (data.length === 0) {
			rootTs = "unknown[]";
		} else {
			// Use singular name for element type to avoid clash with rootName
			rootTs = inferValue(data, toSingular(rootName), ctx, []);
		}
	} else if (typeof data === "object") {
		// Root object: generate fields without extracting root itself
		const body = inferObjectShape(
			[data as Record<string, unknown>],
			rootName,
			ctx,
		);
		rootTs = `{\n${body}\n}`;
	} else {
		rootTs =
			typeof data === "string"
				? "string"
				: typeof data === "number"
					? "number"
					: typeof data === "boolean"
						? "boolean"
						: "unknown";
	}

	const parts: string[] = [];
	if (!inline) {
		for (const [name, body] of ctx.extracted) {
			parts.push(`type ${name} = {\n${body}\n}`);
		}
	}
	parts.push(`type ${rootName} = ${rootTs}`);

	return parts.join("\n\n");
}
