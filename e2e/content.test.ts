import { expect, test } from "./fixtures";

const JSON_URL = "https://jsonplaceholder.typicode.com/todos/1";

test("renders JSON viewer on a JSON response page", async ({ page }) => {
	await page.goto(JSON_URL);
	await expect(page.locator(".app")).toBeVisible();
});

test("shows the tree view by default", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await expect(
		page.locator(".tree-view, [class*='tree']").first(),
	).toBeVisible();
});

test("can switch to raw tab", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await page.getByRole("button", { name: /raw/i }).click();
	await expect(
		page.locator("textarea.raw-area, .raw-view").first(),
	).toBeVisible();
});

test("shows size in bottom bar", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await expect(
		page.locator(".bottom-bar, [class*='bottom']").first(),
	).toBeVisible();
});

test("can switch to minify tab", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await page.getByRole("button", { name: /minify/i }).click();
	await expect(page.locator("textarea.raw-area").first()).toBeVisible();
});

test("can switch to TypeScript tab", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await page.getByRole("button", { name: /ts/i }).click();
	await expect(page.locator(".ts-view")).toBeVisible();
});

test("can use jq tab and evaluate expression", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await page.getByRole("button", { name: "jq" }).click();
	await expect(page.locator(".jqbar")).toBeVisible();
	await page.locator(".jq-input").fill(".title");
	await page.getByRole("button", { name: /run/i }).click();
	await expect(page.locator(".jq-result-view")).toBeVisible();
});

test("search finds matches", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await page.locator(".search-input").fill("delectus");
	await expect(page.locator(".search-meta")).toContainText("1");
});

test("collapse and expand all", async ({ page }) => {
	await page.goto(JSON_URL);
	await page.waitForSelector(".app");
	await page.getByRole("button", { name: /collapse/i }).click();
	await expect(page.locator(".pill").first()).toBeVisible();
	await page.getByRole("button", { name: /expand/i }).click();
	await expect(page.locator(".pill")).toHaveCount(0);
});

test("does not activate on normal HTML pages", async ({ page }) => {
	await page.goto("https://example.com");
	await page.waitForLoadState("domcontentloaded");
	await expect(page.locator(".app")).toHaveCount(0);
});
