import { SearchBar } from "@content/components/SearchBar";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const defaultProps = {
	query: "",
	caseSen: false,
	matchIdx: -1,
	matchCount: 0,
	onQueryChange: vi.fn(),
	onCaseSenToggle: vi.fn(),
	onStepMatch: vi.fn(),
};

describe("SearchBar", () => {
	it("renders without meta when query is empty", () => {
		render(<SearchBar {...defaultProps} />);
		const meta = document.querySelector(".search-meta");
		expect(meta?.textContent).toBe("");
	});

	it("shows match count when query and matches exist", () => {
		render(
			<SearchBar {...defaultProps} query="foo" matchIdx={0} matchCount={3} />,
		);
		expect(screen.getByText("1 / 3")).toBeTruthy();
	});

	it("shows no matches when query exists but no results", () => {
		render(<SearchBar {...defaultProps} query="xyz" matchCount={0} />);
		expect(screen.getByText("no matches")).toBeTruthy();
	});

	it("calls onQueryChange on input change", () => {
		const onQueryChange = vi.fn();
		render(<SearchBar {...defaultProps} onQueryChange={onQueryChange} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "test" } });
		expect(onQueryChange).toHaveBeenCalledWith("test");
	});

	it("calls onStepMatch(1) on Enter key", () => {
		const onStepMatch = vi.fn();
		render(<SearchBar {...defaultProps} onStepMatch={onStepMatch} />);
		fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
		expect(onStepMatch).toHaveBeenCalledWith(1);
	});

	it("calls onStepMatch(-1) on Shift+Enter", () => {
		const onStepMatch = vi.fn();
		render(<SearchBar {...defaultProps} onStepMatch={onStepMatch} />);
		fireEvent.keyDown(screen.getByRole("textbox"), {
			key: "Enter",
			shiftKey: true,
		});
		expect(onStepMatch).toHaveBeenCalledWith(-1);
	});

	it("calls onQueryChange('') on Escape key", () => {
		const onQueryChange = vi.fn();
		render(<SearchBar {...defaultProps} onQueryChange={onQueryChange} />);
		fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
		expect(onQueryChange).toHaveBeenCalledWith("");
	});

	it("calls onStepMatch(-1) on prev button click", () => {
		const onStepMatch = vi.fn();
		render(<SearchBar {...defaultProps} onStepMatch={onStepMatch} />);
		fireEvent.click(screen.getByTitle("Previous"));
		expect(onStepMatch).toHaveBeenCalledWith(-1);
	});

	it("calls onStepMatch(1) on next button click", () => {
		const onStepMatch = vi.fn();
		render(<SearchBar {...defaultProps} onStepMatch={onStepMatch} />);
		fireEvent.click(screen.getByTitle("Next"));
		expect(onStepMatch).toHaveBeenCalledWith(1);
	});

	it("calls onCaseSenToggle on case button click", () => {
		const onCaseSenToggle = vi.fn();
		render(<SearchBar {...defaultProps} onCaseSenToggle={onCaseSenToggle} />);
		fireEvent.click(screen.getByTitle("Case sensitive"));
		expect(onCaseSenToggle).toHaveBeenCalled();
	});

	it("marks case button as on when caseSen is true", () => {
		render(<SearchBar {...defaultProps} caseSen={true} />);
		const btn = screen.getByTitle("Case sensitive");
		expect(btn.className).toContain("on");
	});
});
