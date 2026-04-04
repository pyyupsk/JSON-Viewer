import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toast } from "../../entrypoints/content/components/Toast";

describe("Toast", () => {
	it("renders with no message", () => {
		const { container } = render(<Toast message={null} />);
		const el = container.firstChild as HTMLElement;
		expect(el.className).toBe("toast");
		expect(el.textContent).toBe("");
	});

	it("renders with a message and show class", () => {
		render(<Toast message="Copied!" />);
		const el = screen.getByText("Copied!");
		expect(el.className).toBe("toast show");
	});
});
