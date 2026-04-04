import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JqBar } from "../../entrypoints/content/components/JqBar";

const defaultProps = {
	expr: "",
	result: null,
	error: null,
	onExprChange: vi.fn(),
	onRun: vi.fn(),
	onEscape: vi.fn(),
};

describe("JqBar", () => {
	it("renders without status when result and error are null", () => {
		const { container } = render(<JqBar {...defaultProps} />);
		expect(container.querySelector(".jq-status")).toBeNull();
	});

	it("shows ok status when result is set", () => {
		const { container } = render(<JqBar {...defaultProps} result="42" />);
		const status = container.querySelector(".jq-status");
		expect(status?.className).toContain("ok");
	});

	it("shows error status when error is set", () => {
		const { container } = render(
			<JqBar {...defaultProps} error="parse error" />,
		);
		const status = container.querySelector(".jq-status");
		expect(status?.className).toContain("err");
		expect(status?.textContent).toContain("parse error");
	});

	it("calls onExprChange on input change", () => {
		const onExprChange = vi.fn();
		const { container } = render(
			<JqBar {...defaultProps} onExprChange={onExprChange} />,
		);
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: ".foo" } });
		expect(onExprChange).toHaveBeenCalledWith(".foo");
	});

	it("calls onRun on Enter key", () => {
		const onRun = vi.fn();
		const { container } = render(<JqBar {...defaultProps} onRun={onRun} />);
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onRun).toHaveBeenCalled();
	});

	it("calls onEscape on Escape key", () => {
		const onEscape = vi.fn();
		const { container } = render(
			<JqBar {...defaultProps} onEscape={onEscape} />,
		);
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.keyDown(input, { key: "Escape" });
		expect(onEscape).toHaveBeenCalled();
	});

	it("calls onRun on Run button click", () => {
		const onRun = vi.fn();
		const { container } = render(<JqBar {...defaultProps} onRun={onRun} />);
		fireEvent.click(within(container).getByRole("button", { name: /Run/ }));
		expect(onRun).toHaveBeenCalled();
	});
});
