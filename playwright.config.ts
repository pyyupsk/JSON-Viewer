import path from "node:path";
import { defineConfig } from "@playwright/test";

const extensionPath = path.resolve(".output/chrome-mv3");

export default defineConfig({
	testDir: "e2e",
	use: {
		// Extensions only work with persistent context — see e2e/fixtures.ts
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chrome",
			use: {
				// Passed to fixtures via test.extend; stored here for reference
				// @ts-expect-error custom project option
				extensionPath,
			},
		},
	],
	// Build the extension before running e2e tests: `wxt build && playwright test`
	webServer: undefined,
});
