import path from "node:path";
import { type BrowserContext, test as base, chromium } from "@playwright/test";

const extensionPath = path.resolve(".output/chrome-mv3");

export const test = base.extend<{
	context: BrowserContext;
	extensionId: string;
}>({
	context: async (_, use) => {
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

	extensionId: async ({ context }, use) => {
		let [worker] = context.serviceWorkers();
		if (!worker) worker = await context.waitForEvent("serviceworker");
		await use(worker.url().split("/")[2]); // NOSONAR - False positive React Hook
	},
});

export const expect = test.expect;
