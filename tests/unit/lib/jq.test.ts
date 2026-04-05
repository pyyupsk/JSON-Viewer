import { jq, suggest } from "@content/lib/jq";
import { describe, expect, it } from "vitest";

const run = jq.run.bind(jq);

describe("jq", () => {
	// ── Identity ────────────────────────────────────────────────────────────────

	describe("identity", () => {
		it("returns data for '.'", () => {
			expect(run(".", { a: 1 })).toEqual({ a: 1 });
		});
		it("returns data for empty expression", () => {
			expect(run("", 42)).toBe(42);
		});
	});

	// ── Path access ─────────────────────────────────────────────────────────────

	describe("path access", () => {
		it("accesses top-level key", () => {
			expect(run(".name", { name: "Alice" })).toBe("Alice");
		});
		it("accesses nested key", () => {
			expect(run(".a.b", { a: { b: 42 } })).toBe(42);
		});
		it("accesses array index", () => {
			expect(run(".[0]", [10, 20, 30])).toBe(10);
		});
		it("accesses nested via array index", () => {
			expect(run(".[1].x", [{ x: 1 }, { x: 2 }])).toBe(2);
		});
		it("returns null for missing key", () => {
			expect(run(".missing", { a: 1 })).toBeNull();
		});
		it("iterates array with .[]", () => {
			expect(run(".[]", [1, 2, 3])).toEqual([1, 2, 3]);
		});
		it("iterates object values with .[]", () => {
			const result = run(".[]", { a: 1, b: 2 }) as unknown[];
			expect(result).toEqual([1, 2]);
		});
		it("returns null when intermediate path is null", () => {
			expect(run(".a.b", { a: null })).toBeNull();
		});
		it("accesses object field via bracket notation with string key", () => {
			expect(run('.["name"]', { name: "Alice" })).toBe("Alice");
		});
		it("throws on .[] of non-iterable", () => {
			expect(() => run(".[]", 42)).toThrow("not iterable");
		});
		it("unknown expression throws", () => {
			expect(() => run("unknownExpr", {})).toThrow("Unknown");
		});
	});

	// ── Literals ────────────────────────────────────────────────────────────────

	describe("literals", () => {
		it("returns string literal", () => {
			expect(run('"hello"', null)).toBe("hello");
		});
		it("returns number literal", () => {
			expect(run("42", null)).toBe(42);
		});
		it("returns true", () => {
			expect(run("true", null)).toBe(true);
		});
		it("returns false", () => {
			expect(run("false", null)).toBe(false);
		});
		it("returns null", () => {
			expect(run("null", null)).toBeNull();
		});
	});

	// ── Pipe ────────────────────────────────────────────────────────────────────

	describe("pipe", () => {
		it("chains expressions with |", () => {
			expect(run(".a | .b", { a: { b: 99 } })).toBe(99);
		});
		it("chains multiple pipes", () => {
			expect(run(".items | .[0] | .id", { items: [{ id: 7 }] })).toBe(7);
		});
	});

	// ── Array/object constructors ────────────────────────────────────────────────

	describe("constructors", () => {
		it("builds an object", () => {
			expect(run("{ a: .x, b: .y }", { x: 1, y: 2 })).toEqual({ a: 1, b: 2 });
		});
		it("builds an array", () => {
			expect(run("[.a, .b]", { a: 1, b: 2 })).toEqual([1, 2]);
		});
		it("builds empty array", () => {
			expect(run("[]", {})).toEqual([]);
		});
		it("builds object with shorthand field (no colon)", () => {
			expect(run("{name}", { name: "Alice" })).toEqual({ name: "Alice" });
		});
		it("builds object with dot-shorthand field", () => {
			expect(run("{.age}", { age: 30 })).toEqual({ age: 30 });
		});
	});

	// ── Keywords ────────────────────────────────────────────────────────────────

	describe("keywords", () => {
		it("keys returns object keys in insertion order", () => {
			expect(run("keys", { a: 1, b: 2 })).toEqual(["a", "b"]);
		});
		it("values returns object values", () => {
			const result = run("values", { a: 1, b: 2 }) as number[];
			expect(result.toSorted((a, b) => a - b)).toEqual([1, 2]);
		});
		it("length of array", () => {
			expect(run("length", [1, 2, 3])).toBe(3);
		});
		it("length of string", () => {
			expect(run("length", "hello")).toBe(5);
		});
		it("length of object", () => {
			expect(run("length", { a: 1, b: 2 })).toBe(2);
		});
		it("type returns type name", () => {
			expect(run("type", [])).toBe("array");
			expect(run("type", {})).toBe("object");
			expect(run("type", "hi")).toBe("string");
			expect(run("type", 1)).toBe("number");
			expect(run("type", null)).toBe("null");
		});
		it("not negates", () => {
			expect(run("not", false)).toBe(true);
			expect(run("not", true)).toBe(false);
		});
		it("tostring converts number", () => {
			expect(run("tostring", 42)).toBe("42");
		});
		it("tonumber converts string", () => {
			expect(run("tonumber", "3.14")).toBe(3.14);
		});
		it("ascii_downcase lowercases", () => {
			expect(run("ascii_downcase", "HELLO")).toBe("hello");
		});
		it("ascii_upcase uppercases", () => {
			expect(run("ascii_upcase", "hello")).toBe("HELLO");
		});
		it("to_entries converts object", () => {
			expect(run("to_entries", { a: 1 })).toEqual([{ key: "a", value: 1 }]);
		});
		it("from_entries converts entries", () => {
			expect(run("from_entries", [{ key: "a", value: 1 }])).toEqual({ a: 1 });
		});
		it("add sums numbers", () => {
			expect(run("add", [1, 2, 3])).toBe(6);
		});
		it("add concatenates strings", () => {
			expect(run("add", ["a", "b", "c"])).toBe("abc");
		});
		it("add merges objects", () => {
			expect(run("add", [{ a: 1 }, { b: 2 }])).toEqual({ a: 1, b: 2 });
		});
		it("add concatenates arrays", () => {
			expect(
				run("add", [
					[1, 2],
					[3, 4],
				]),
			).toEqual([1, 2, 3, 4]);
		});
		it("add returns null for empty array", () => {
			expect(run("add", [])).toBeNull();
		});
		it("add returns null for non-array", () => {
			expect(run("add", 42)).toBeNull();
		});
		it("add falls back to last value for mixed types", () => {
			expect(run("add", [true, "hello"])).toBe("hello");
		});
		it("recurse via .. alias", () => {
			const result = run("..", { a: { b: 1 } }) as unknown[];
			expect(result.length).toBeGreaterThan(1);
		});
		it("length returns 0 for null", () => {
			expect(run("length", null)).toBe(0);
		});
		it("from_entries uses name key as fallback", () => {
			expect(run("from_entries", [{ name: "a", value: 1 }])).toEqual({ a: 1 });
		});
	});

	// ── Functions ────────────────────────────────────────────────────────────────

	describe("functions", () => {
		it("map transforms array", () => {
			expect(run("map(.x)", [{ x: 1 }, { x: 2 }])).toEqual([1, 2]);
		});
		it("select filters", () => {
			expect(
				run("map(select(.x > 1))", [{ x: 1 }, { x: 2 }, { x: 3 }]),
			).toEqual([{ x: 2 }, { x: 3 }]);
		});
		it("has checks key existence", () => {
			expect(run('has("a")', { a: 1 })).toBe(true);
			expect(run('has("b")', { a: 1 })).toBe(false);
		});
		it("if-then-else", () => {
			expect(run("if .x > 0 then .x else 0 end", { x: 5 })).toBe(5);
			expect(run("if .x > 0 then .x else 0 end", { x: -1 })).toBe(0);
		});
		it("sort_by sorts array", () => {
			const data = [{ n: 3 }, { n: 1 }, { n: 2 }];
			expect(run("sort_by(.n)", data)).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
		});
		it("group_by groups array", () => {
			const data = [{ t: "a" }, { t: "b" }, { t: "a" }];
			const result = run("group_by(.t)", data) as unknown[][];
			expect(result).toHaveLength(2);
		});
		it("unique_by deduplicates", () => {
			const data = [
				{ id: 1, v: "a" },
				{ id: 1, v: "b" },
				{ id: 2, v: "c" },
			];
			expect(run("unique_by(.id)", data)).toHaveLength(2);
		});
		it("split splits string", () => {
			expect(run('split(",")', "a,b,c")).toEqual(["a", "b", "c"]);
		});
		it("join joins array", () => {
			expect(run('join(",")', ["a", "b", "c"])).toBe("a,b,c");
		});
		it("ltrimstr removes prefix", () => {
			expect(run('ltrimstr("foo")', "foobar")).toBe("bar");
			expect(run('ltrimstr("baz")', "foobar")).toBe("foobar");
		});
		it("rtrimstr removes suffix", () => {
			expect(run('rtrimstr("bar")', "foobar")).toBe("foo");
			expect(run('rtrimstr("baz")', "foobar")).toBe("foobar");
		});
		it("map_values transforms object values", () => {
			expect(
				run("map_values(.name)", { a: { name: "Alice" }, b: { name: "Bob" } }),
			).toEqual({ a: "Alice", b: "Bob" });
		});
		it("map_values transforms array values", () => {
			expect(run("map_values(tostring)", [1, 2, 3])).toEqual(["1", "2", "3"]);
		});
		it("map on object uses Object.values", () => {
			const result = run("map(tostring)", { a: 1, b: 2 }) as string[];
			expect(result).toEqual(["1", "2"]);
		});
		it("select with boolean field (no comparison)", () => {
			expect(
				run("map(select(.active))", [{ active: true }, { active: false }]),
			).toEqual([{ active: true }]);
		});
		it("if-then without else returns data when condition false", () => {
			expect(run("if .x > 0 then .x end", { x: -1 })).toEqual({ x: -1 });
		});
		it("if-then without else returns value when condition true", () => {
			expect(run("if .x > 0 then .x end", { x: 5 })).toBe(5);
		});
	});

	// ── Comparisons ─────────────────────────────────────────────────────────────

	describe("comparisons in select", () => {
		it("== equality", () => {
			expect(run('select(. == "hi")', "hi")).toBe("hi");
			expect(run('select(. == "hi")', "bye")).toBeUndefined();
		});
		it("!= inequality", () => {
			expect(run("select(. != 1)", 2)).toBe(2);
			expect(run("select(. != 1)", 1)).toBeUndefined();
		});
		it("> greater than", () => {
			expect(run("select(. > 5)", 10)).toBe(10);
			expect(run("select(. > 5)", 3)).toBeUndefined();
		});
		it("< less than", () => {
			expect(run("select(. < 5)", 3)).toBe(3);
		});
		it(">= greater than or equal", () => {
			expect(run("select(. >= 5)", 5)).toBe(5);
		});
		it("<= less than or equal", () => {
			expect(run("select(. <= 5)", 5)).toBe(5);
		});
		it("== comparison with null rv", () => {
			expect(run("select(. == null)", null)).toBeNull();
		});
		it("== comparison with true rv", () => {
			expect(run("select(. == true)", true)).toBe(true);
		});
		it("== comparison with false rv", () => {
			expect(run("select(. == false)", false)).toBe(false);
		});
		it("!= comparison with numeric rv", () => {
			expect(run("select(. != 42)", 1)).toBe(1);
		});
	});

	// ── Comma / multi-output ────────────────────────────────────────────────────

	describe("comma", () => {
		it("comma produces multiple values as array", () => {
			expect(run(".a, .b", { a: 1, b: 2 })).toEqual([1, 2]);
		});
	});
});

describe("suggest", () => {
	describe("key completions", () => {
		it("suggests first key when expr is '.'", () => {
			expect(suggest(".", { name: "Alice", age: 30 })).toBe("name");
		});

		it("suggests suffix for partial key", () => {
			expect(suggest(".na", { name: "Alice" })).toBe("me");
		});

		it("suggests key after trailing dot", () => {
			expect(suggest(".user.", { user: { id: 1, role: "admin" } })).toBe("id");
		});

		it("suggests nested partial key", () => {
			expect(suggest(".user.ro", { user: { role: "admin" } })).toBe("le");
		});

		it("returns empty string when partial matches nothing", () => {
			expect(suggest(".xyz", { name: "Alice" })).toBe("");
		});

		it("returns empty string when context is not an object", () => {
			expect(suggest(".name.", { name: "Alice" })).toBe("");
		});

		it("returns empty string when jq.run throws on invalid prefix", () => {
			expect(suggest(".bad[[[", { name: "Alice" })).toBe("");
		});
	});

	describe("builtin completions", () => {
		it("suggests builtin suffix for partial word", () => {
			expect(suggest("ma", {})).toBe("p(");
		});

		it("suggests builtin suffix after pipe", () => {
			expect(suggest(". | sel", {})).toBe("ect(");
		});

		it("suggests keyword without parens", () => {
			expect(suggest("ke", {})).toBe("ys");
		});

		it("returns empty string when no builtin matches", () => {
			expect(suggest("xyz", {})).toBe("");
		});
	});

	describe("edge cases", () => {
		it("returns empty string for empty expression", () => {
			expect(suggest("", {})).toBe("");
		});

		it("key completion takes priority over builtin", () => {
			expect(suggest(".to", { top: 1 })).toBe("p");
		});
	});
});
