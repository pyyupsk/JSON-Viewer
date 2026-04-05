import { TopBar } from "@content/components/TopBar";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const defaultProps = {
	tab: "tree" as const,
	onTabChange: vi.fn(),
	onCollapseAll: vi.fn(),
	onExpandAll: vi.fn(),
	onCopyAll: vi.fn(),
};

describe("TopBar", () => {
	it("marks Tree tab as active by default", () => {
		render(<TopBar {...defaultProps} tab="tree" />);
		const treeBtn = screen.getByRole("button", { name: "Tree" });
		expect(treeBtn.className).toContain("on");
	});

	it("marks Raw tab as active when tab=raw", () => {
		render(<TopBar {...defaultProps} tab="raw" />);
		expect(screen.getByRole("button", { name: "Raw" }).className).toContain(
			"on",
		);
	});

	it("marks Minify tab as active when tab=minify", () => {
		render(<TopBar {...defaultProps} tab="minify" />);
		expect(screen.getByRole("button", { name: "Minify" }).className).toContain(
			"on",
		);
	});

	it("marks jq tab as active when tab=jq", () => {
		render(<TopBar {...defaultProps} tab="jq" />);
		expect(screen.getByRole("button", { name: "jq" }).className).toContain(
			"on",
		);
	});

	it("calls onTabChange when clicking tabs", () => {
		const onTabChange = vi.fn();
		render(<TopBar {...defaultProps} onTabChange={onTabChange} />);
		fireEvent.click(screen.getByRole("button", { name: "Raw" }));
		expect(onTabChange).toHaveBeenCalledWith("raw");
		fireEvent.click(screen.getByRole("button", { name: "Minify" }));
		expect(onTabChange).toHaveBeenCalledWith("minify");
		fireEvent.click(screen.getByRole("button", { name: "jq" }));
		expect(onTabChange).toHaveBeenCalledWith("jq");
	});

	it("calls onCollapseAll on Collapse click", () => {
		const onCollapseAll = vi.fn();
		render(<TopBar {...defaultProps} onCollapseAll={onCollapseAll} />);
		fireEvent.click(screen.getByRole("button", { name: /Collapse/ }));
		expect(onCollapseAll).toHaveBeenCalled();
	});

	it("calls onExpandAll on Expand click", () => {
		const onExpandAll = vi.fn();
		render(<TopBar {...defaultProps} onExpandAll={onExpandAll} />);
		fireEvent.click(screen.getByRole("button", { name: /Expand/ }));
		expect(onExpandAll).toHaveBeenCalled();
	});

	it("calls onCopyAll on Copy click", () => {
		const onCopyAll = vi.fn();
		render(<TopBar {...defaultProps} onCopyAll={onCopyAll} />);
		fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
		expect(onCopyAll).toHaveBeenCalled();
	});

	it("calls onTabChange with tree when clicking Tree tab", () => {
		const onTabChange = vi.fn();
		render(<TopBar {...defaultProps} tab="raw" onTabChange={onTabChange} />);
		fireEvent.click(screen.getByRole("button", { name: "Tree" }));
		expect(onTabChange).toHaveBeenCalledWith("tree");
	});
});
