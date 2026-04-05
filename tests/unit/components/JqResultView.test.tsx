import { JqResultView } from "@content/components/JqResultView";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("JqResultView", () => {
	it("renders result in a pre element", () => {
		const { container } = render(<JqResultView result="42" />);
		const pre = container.querySelector("pre");
		expect(pre?.textContent).toBe("42");
	});
});
