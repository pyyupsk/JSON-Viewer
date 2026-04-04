import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing";

export default defineConfig({
	plugins: [WxtVitest()],
	test: {
		include: ["tests/unit/**/*.test.{ts,tsx}"],
		environment: "happy-dom",
		setupFiles: ["tests/unit/setup.ts"],
		coverage: {
			provider: "v8",
			include: ["entrypoints/**/*.ts", "entrypoints/**/*.tsx"],
			exclude: ["entrypoints/background.ts", "entrypoints/content/index.tsx"],
			reporter: ["text", "html", "json"],
			thresholds: {
				statements: 85,
				branches: 85,
				functions: 85,
				lines: 85,
			},
		},
	},
});
