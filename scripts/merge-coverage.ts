// @ts-nocheck — istanbul packages ship CommonJS types; skipping strict type-check here
import { existsSync, readFileSync } from "node:fs";
import { createCoverageMap } from "istanbul-lib-coverage";
import { createContext } from "istanbul-lib-report";
import reports from "istanbul-reports";

const map = createCoverageMap({});

const sources = [
	{ label: "unit tests", file: "coverage/coverage-final.json" },
	{ label: "e2e tests", file: "coverage-e2e/coverage-final.json" },
];

for (const { label, file } of sources) {
	if (existsSync(file)) {
		map.merge(JSON.parse(readFileSync(file, "utf-8")));
		console.log(`✓ Merged ${label} coverage from ${file}`);
	} else {
		console.warn(`⚠ No coverage found for ${label} (${file} missing)`);
	}
}

const ctx = createContext({ dir: "coverage-all", coverageMap: map });
reports.create("text").execute(ctx);
reports.create("html").execute(ctx);

console.log("\nCombined report written to coverage-all/index.html");
