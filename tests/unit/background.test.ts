import { describe, it } from "vitest";

describe("background", () => {
	it("loads without error", async () => {
		await import("../../entrypoints/background");
	});
});
