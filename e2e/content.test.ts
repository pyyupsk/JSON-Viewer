import { expect, test } from "./fixtures";

const JSON_URL = "https://jsonplaceholder.typicode.com/todos/1";

test("renders JSON viewer on a JSON response page", async ({ context }) => {
	const page = await context.newPage();
	await page.goto(JSON_URL);

	// The content script mounts an .app element over the page
	await expect(page.locator(".app")).toBeVisible();
});

test("shows the tree view by default", async ({ context }) => {
	const page = await context.newPage();
	await page.goto(JSON_URL);

	await page.waitForSelector(".app");
	await expect(
		page.locator(".tree-view, [class*='tree']").first(),
	).toBeVisible();
});

test("can switch to raw tab", async ({ context }) => {
	const page = await context.newPage();
	await page.goto(JSON_URL);

	await page.waitForSelector(".app");
	await page.getByRole("button", { name: /raw/i }).click();
	await expect(
		page.locator("textarea.raw-area, .raw-view").first(),
	).toBeVisible();
});

test("shows size in bottom bar", async ({ context }) => {
	const page = await context.newPage();
	await page.goto(JSON_URL);

	await page.waitForSelector(".app");
	// Bottom bar contains KB size info
	await expect(
		page.locator(".bottom-bar, [class*='bottom']").first(),
	).toBeVisible();
});
