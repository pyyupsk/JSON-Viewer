import { describe, expect, it } from "vitest";
import { jsonToTs, nameFromUrl } from "../../entrypoints/content/typescript";

describe("nameFromUrl", () => {
	it("converts last path segment to PascalCase", () => {
		expect(nameFromUrl("/api/users")).toBe("Users");
	});

	it("skips numeric last segment and uses parent", () => {
		expect(nameFromUrl("/todos/1")).toBe("Todos");
	});

	it("handles kebab-case segment", () => {
		expect(nameFromUrl("/api/user-profiles")).toBe("UserProfiles");
	});

	it("returns Root for bare slash", () => {
		expect(nameFromUrl("/")).toBe("Root");
	});

	it("returns Root for empty string", () => {
		expect(nameFromUrl("")).toBe("Root");
	});
});

describe("jsonToTs", () => {
	describe("primitives at root", () => {
		it("types a string root", () => {
			expect(jsonToTs("hello", "Root", false)).toBe("type Root = string");
		});

		it("types a number root", () => {
			expect(jsonToTs(42, "Root", false)).toBe("type Root = number");
		});

		it("types a boolean root", () => {
			expect(jsonToTs(true, "Root", false)).toBe("type Root = boolean");
		});

		it("types a null root", () => {
			expect(jsonToTs(null, "Root", false)).toBe("type Root = null");
		});
	});

	describe("simple objects", () => {
		it("generates a flat object type", () => {
			expect(
				jsonToTs({ name: "Alice", age: 30, active: true }, "Root", false),
			).toBe(
				"type Root = {\n  name: string\n  age: number\n  active: boolean\n}",
			);
		});

		it("types null field as null when no inference available", () => {
			expect(jsonToTs({ location: null }, "Root", false)).toBe(
				"type Root = {\n  location: null\n}",
			);
		});
	});

	describe("nested objects — extracted mode", () => {
		it("extracts a nested object to its own named type", () => {
			expect(
				jsonToTs({ author: { name: "Ada", age: 36 } }, "Root", false),
			).toBe(
				"type Author = {\n  name: string\n  age: number\n}\n\ntype Root = {\n  author: Author\n}",
			);
		});

		it("reuses extracted type when the same shape appears twice", () => {
			const result = jsonToTs({ a: { x: 1 }, b: { x: 1 } }, "Root", false);
			// Only one extracted type, not two
			expect(result.match(/^type A = /gm)?.length).toBe(1);
			expect(result).toContain("type Root = {\n  a: A\n  b: A\n}");
		});

		it("uses numeric suffix for different shapes with the same derived name", () => {
			const result = jsonToTs(
				{ user: { id: 1 }, user2: { name: "Bob" } },
				"Root",
				false,
			);
			expect(result).toContain("type User =");
			expect(result).toContain("type User2 =");
		});

		it("avoids duplicate type name when extracted key matches rootName", () => {
			const result = jsonToTs({ user: { id: 1 } }, "User", false);
			// Should not contain "type User" twice
			expect(result.match(/^type User /gm)?.length).toBe(1);
			expect(result).toContain("type User = {\n  user: User2\n}");
		});
	});

	describe("nested objects — inline mode", () => {
		it("writes nested objects inline", () => {
			expect(jsonToTs({ author: { name: "Ada" } }, "Root", true)).toBe(
				"type Root = {\n  author: {\n  name: string\n}\n}",
			);
		});
	});

	describe("arrays", () => {
		it("types an empty array as unknown[]", () => {
			expect(jsonToTs([], "Items", false)).toBe("type Items = unknown[]");
		});

		it("types an array of primitives", () => {
			expect(jsonToTs([1, 2, 3], "Items", false)).toBe("type Items = number[]");
		});

		it("types an array of uniform objects", () => {
			const result = jsonToTs(
				[
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" },
				],
				"Users",
				false,
			);
			expect(result).toContain(
				"type User = {\n  id: number\n  name: string\n}",
			);
			expect(result).toContain("type Users = User[]");
		});

		it("marks keys missing from some items as optional", () => {
			const result = jsonToTs(
				[{ id: 1, name: "Alice" }, { id: 2 }],
				"Users",
				false,
			);
			expect(result).toContain("name?: string");
		});

		it("unions mixed primitive types", () => {
			expect(jsonToTs([1, "hello"], "Items", false)).toBe(
				"type Items = (number | string)[]",
			);
		});
	});

	describe("null inference", () => {
		it("infers T | null from sibling array items", () => {
			const result = jsonToTs(
				[
					{ name: "Ada", email: null },
					{ name: "Bob", email: "bob@dev.com" },
				],
				"Users",
				false,
			);
			expect(result).toContain("email: string | null");
		});

		it("falls back to null when no inference is possible", () => {
			expect(jsonToTs({ location: null }, "Root", false)).toBe(
				"type Root = {\n  location: null\n}",
			);
		});
	});
});
