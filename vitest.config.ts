import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing";

export default defineConfig({
	plugins: [WxtVitest()],
	test: {
		include: ["tests/unit/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: ["entrypoints/**/*.ts", "entrypoints/**/*.tsx"],
			reporter: ["text", "html"],
		},
	},
});
