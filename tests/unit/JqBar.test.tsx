// @vitest-environment happy-dom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JqBar } from "../../entrypoints/content/components/JqBar";

const baseProps = {
	expr: "",
	result: null,
	error: null,
	data: { name: "Alice", age: 30 },
	onExprChange: vi.fn(),
	onRun: vi.fn(),
	onEscape: vi.fn(),
};

describe("JqBar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders without status when result and error are null", () => {
		const { container } = render(<JqBar {...baseProps} />);
		expect(container.querySelector(".jq-status")).toBeNull();
	});

	it("shows ok status when result is set", () => {
		const { container } = render(<JqBar {...baseProps} result="42" />);
		const status = container.querySelector(".jq-status");
		expect(status?.className).toContain("ok");
	});

	it("shows error status when error is set", () => {
		const { container } = render(<JqBar {...baseProps} error="parse error" />);
		const status = container.querySelector(".jq-status");
		expect(status?.className).toContain("err");
		expect(status?.textContent).toContain("parse error");
	});

	it("calls onExprChange on input change", () => {
		const onExprChange = vi.fn();
		const { container } = render(
			<JqBar {...baseProps} onExprChange={onExprChange} />,
		);
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: ".foo" } });
		expect(onExprChange).toHaveBeenCalledWith(".foo");
	});

	it("calls onRun on Run button click", () => {
		const onRun = vi.fn();
		const { container } = render(<JqBar {...baseProps} onRun={onRun} />);
		fireEvent.click(within(container).getByRole("button", { name: /Run/ }));
		expect(onRun).toHaveBeenCalled();
	});

	describe("ghost suggestion", () => {
		it("shows ghost suffix when suggest returns a value", () => {
			render(<JqBar {...baseProps} expr=".na" />);
			expect(screen.getByText("me")).toBeTruthy();
		});

		it("shows no ghost suffix when there is no suggestion", () => {
			render(<JqBar {...baseProps} expr=".xyz" />);
			expect(
				document.querySelector(".jq-ghost-suffix")?.textContent,
			).toBeFalsy();
		});

		it("shows no ghost when expr is empty", () => {
			render(<JqBar {...baseProps} expr="" />);
			expect(document.querySelector(".jq-ghost")).toBeNull();
		});
	});

	describe("Tab acceptance", () => {
		it("appends ghost suffix on Tab and calls onExprChange", async () => {
			const onExprChange = vi.fn();
			render(<JqBar {...baseProps} expr=".na" onExprChange={onExprChange} />);
			const input = screen.getByRole("textbox");
			input.focus();
			await userEvent.keyboard("{Tab}");
			expect(onExprChange).toHaveBeenCalledWith(".name");
		});

		it("does nothing on Tab when there is no suggestion", async () => {
			const onExprChange = vi.fn();
			render(<JqBar {...baseProps} expr=".xyz" onExprChange={onExprChange} />);
			const input = screen.getByRole("textbox");
			input.focus();
			await userEvent.keyboard("{Tab}");
			expect(onExprChange).not.toHaveBeenCalled();
		});
	});

	describe("keyboard", () => {
		it("calls onEscape on Escape key", async () => {
			const onEscape = vi.fn();
			render(<JqBar {...baseProps} onEscape={onEscape} />);
			const input = screen.getByRole("textbox");
			input.focus();
			await userEvent.keyboard("{Escape}");
			expect(onEscape).toHaveBeenCalled();
		});

		it("calls onRun on Enter key", async () => {
			const onRun = vi.fn();
			render(<JqBar {...baseProps} onRun={onRun} />);
			const input = screen.getByRole("textbox");
			input.focus();
			await userEvent.keyboard("{Enter}");
			expect(onRun).toHaveBeenCalled();
		});
	});
});
