export const UNHANDLED = {} as const;

export function toStr(v: unknown): string {
	if (typeof v === "string") return v;
	if (v !== null && typeof v === "object") return JSON.stringify(v);
	return String(v as number | boolean | null | undefined);
}

export function getType(data: unknown): string {
	if (Array.isArray(data)) return "array";
	if (data === null) return "null";
	return typeof data;
}

export function updateDepth(c: string, depth: number): number {
	if ("([{".includes(c)) return depth + 1;
	if (")]}".includes(c)) return depth - 1;
	return depth;
}
