import path from "node:path";
import { defineConfig } from "@playwright/test";

const extensionPath = path.resolve(".output/chrome-mv3");

const coverageReporter = process.env.E2E_COVERAGE
	? [
			[
				"monocart-reporter",
				{
					name: "E2E Coverage",
					outputFile: "coverage-e2e/index.html",
					coverage: {
						entryFilter: (entry: { url: string }) =>
							entry.url.startsWith("chrome-extension://"),
						reports: ["v8", "html"],
					},
				},
			] as const,
		]
	: [];

export default defineConfig({
	testDir: "e2e",
	reporter: [["list"], ...coverageReporter],
	use: {
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chrome",
			use: {
				// @ts-expect-error custom project option
				extensionPath,
			},
		},
	],
});
