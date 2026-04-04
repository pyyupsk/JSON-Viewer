import { describe, expect, it } from "vitest";
import {
	type CloseRow,
	flattenData,
	type OpenRow,
	type PrimRow,
	rowSearchText,
} from "../../entrypoints/content/flatten";

describe("flattenData", () => {
	it("flattens a primitive value", () => {
		const rows = flattenData(42, new Set());
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ kind: "prim", value: 42, path: "root" });
	});

	it("flattens null", () => {
		const rows = flattenData(null, new Set());
		expect(rows[0]).toMatchObject({ kind: "prim", value: null });
	});

	it("flattens a flat object", () => {
		const rows = flattenData({ a: 1, b: "x" }, new Set());
		// open + 2 prims + close
		expect(rows).toHaveLength(4);
		expect(rows[0]).toMatchObject({ kind: "open", type: "object", count: 2 });
		expect(rows[1]).toMatchObject({ kind: "prim", key: "a", value: 1 });
		expect(rows[2]).toMatchObject({ kind: "prim", key: "b", value: "x" });
		expect(rows[3]).toMatchObject({ kind: "close", type: "object" });
	});

	it("flattens a flat array", () => {
		const rows = flattenData([10, 20], new Set());
		expect(rows).toHaveLength(4);
		expect(rows[0]).toMatchObject({ kind: "open", type: "array", count: 2 });
		expect(rows[1]).toMatchObject({ kind: "prim", key: null, value: 10 });
		expect(rows[2]).toMatchObject({ kind: "prim", key: null, value: 20 });
		expect(rows[3]).toMatchObject({ kind: "close", type: "array" });
	});

	it("flattens nested objects", () => {
		const rows = flattenData({ a: { b: 1 } }, new Set());
		const kinds = rows.map((r) => r.kind);
		expect(kinds).toEqual(["open", "open", "prim", "close", "close"]);
	});

	it("respects collapsed paths", () => {
		const rows = flattenData({ a: { b: 1 } }, new Set(["root"]));
		// collapsed root: only the open row (no children)
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ kind: "open", collapsed: true });
	});

	it("assigns correct paths for object keys", () => {
		const rows = flattenData({ x: 1 }, new Set());
		const prim = rows[1] as PrimRow;
		expect(prim.path).toBe("root.x");
	});

	it("assigns correct paths for array indices", () => {
		const rows = flattenData([1, 2], new Set());
		const first = rows[1] as PrimRow;
		const second = rows[2] as PrimRow;
		expect(first.path).toBe("root[0]");
		expect(second.path).toBe("root[1]");
	});

	it("marks last items with isLast", () => {
		const rows = flattenData({ a: 1, b: 2 }, new Set());
		const [, primA, primB] = rows as [OpenRow, PrimRow, PrimRow, CloseRow];
		expect(primA.isLast).toBe(false);
		expect(primB.isLast).toBe(true);
	});

	it("sets depth correctly", () => {
		const rows = flattenData({ a: { b: 1 } }, new Set());
		expect(rows[0].depth).toBe(0); // root open
		expect(rows[1].depth).toBe(1); // nested open
		expect(rows[2].depth).toBe(2); // prim b
	});
});

describe("rowSearchText", () => {
	it("returns empty string for close row", () => {
		const row: CloseRow = {
			kind: "close",
			path: "root",
			depth: 0,
			type: "object",
			isLast: true,
		};
		expect(rowSearchText(row)).toBe("");
	});

	it("formats string prim with key", () => {
		const row: PrimRow = {
			kind: "prim",
			path: "root.name",
			depth: 1,
			key: "name",
			value: "Alice",
			isLast: true,
		};
		expect(rowSearchText(row)).toBe('"name": "Alice"');
	});

	it("formats number prim without key (array item)", () => {
		const row: PrimRow = {
			kind: "prim",
			path: "root[0]",
			depth: 1,
			key: null,
			value: 42,
			isLast: false,
		};
		expect(rowSearchText(row)).toBe("42");
	});

	it("formats null prim", () => {
		const row: PrimRow = {
			kind: "prim",
			path: "root.x",
			depth: 1,
			key: "x",
			value: null,
			isLast: true,
		};
		expect(rowSearchText(row)).toBe('"x": null');
	});

	it("formats collapsed open row", () => {
		const row: OpenRow = {
			kind: "open",
			path: "root",
			depth: 0,
			key: null,
			type: "object",
			count: 3,
			isLast: true,
			collapsed: true,
			value: {},
		};
		expect(rowSearchText(row)).toBe("{ 3 keys }");
	});

	it("formats expanded open array row", () => {
		const row: OpenRow = {
			kind: "open",
			path: "root",
			depth: 0,
			key: "items",
			type: "array",
			count: 2,
			isLast: false,
			collapsed: false,
			value: [],
		};
		expect(rowSearchText(row)).toBe('"items": [');
	});

	it("formats collapsed open array with key", () => {
		const row: OpenRow = {
			kind: "open",
			path: "root.tags",
			depth: 1,
			key: "tags",
			type: "array",
			count: 5,
			isLast: true,
			collapsed: true,
			value: [],
		};
		expect(rowSearchText(row)).toBe('"tags": [ 5 items ]');
	});
});
