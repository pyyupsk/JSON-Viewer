import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const extensionPath = path.resolve(".output/chrome-mv3");

// Read source maps from the local build instead of fetching chrome-extension:// URLs
function sourceMapResolver(url: string) {
	const match = url.match(/chrome-extension:\/\/[^/]+(\/.*\.js)/);
	if (!match) return null;
	const mapFile = path.join(".output/chrome-mv3", `${match[1]}.map`);
	if (existsSync(mapFile)) return JSON.parse(readFileSync(mapFile, "utf-8"));
	return null;
}

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
						outputDir: "coverage-e2e",
						reports: ["v8", "html", "json"],
						sourceFilter: (sourcePath: string) =>
							!sourcePath.includes("node_modules"),
						sourceMapResolver,
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
