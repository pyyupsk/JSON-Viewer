import path from "node:path";
import {
	type BrowserContext,
	test as base,
	chromium,
	type Page,
} from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";

const extensionPath = path.resolve(".output/chrome-mv3");

export const test = base.extend<{
	context: BrowserContext;
	extensionId: string;
	page: Page;
	codeCoverageAutoTestFixture: undefined;
}>({
	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture must use object destructuring
	context: async ({}, use) => {
		const context = await chromium.launchPersistentContext("", {
			channel: "chromium",
			args: [
				`--disable-extensions-except=${extensionPath}`,
				`--load-extension=${extensionPath}`,
			],
		});
		await use(context); // NOSONAR - False positive React Hook
		await context.close();
	},

	page: async ({ context }, use) => {
		const page = await context.newPage();
		await use(page); // NOSONAR - False positive React Hook
	},

	extensionId: async ({ context }, use) => {
		let [worker] = context.serviceWorkers();
		if (!worker) worker = await context.waitForEvent("serviceworker");
		await use(worker.url().split("/")[2]); // NOSONAR - False positive React Hook
	},

	codeCoverageAutoTestFixture: [
		async ({ page }, use, testInfo) => {
			if (process.env.E2E_COVERAGE) {
				await page.coverage.startJSCoverage({ resetOnNavigation: false });
			}
			await use(undefined);
			if (process.env.E2E_COVERAGE) {
				const coverage = await page.coverage.stopJSCoverage();
				await addCoverageReport(coverage, testInfo);
			}
		},
		{ scope: "test", auto: true },
	],
});

export const expect = test.expect;
