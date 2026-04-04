import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JqResultView } from "../../entrypoints/content/components/JqResultView";

describe("JqResultView", () => {
	it("renders result in a pre element", () => {
		const { container } = render(<JqResultView result="42" />);
		const pre = container.querySelector("pre");
		expect(pre?.textContent).toBe("42");
	});
});
