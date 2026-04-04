import { defineConfig } from "wxt";

export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifest: {
		name: "JSON Viewer",
		description:
			"A browser extension that beautifully formats and displays JSON responses.",
		permissions: ["clipboardWrite"],
	},
	webExt: {
		startUrls: ["https://jsonplaceholder.typicode.com/todos"],
	},
	vite: () => ({
		build: {
			// Source maps are required to map bundled coverage back to TypeScript source
			sourcemap: process.env.E2E_COVERAGE === "1",
		},
	}),
});
