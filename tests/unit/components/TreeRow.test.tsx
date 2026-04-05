import { TreeRow } from "@content/components/TreeRow";
import type { Row } from "@content/lib/flatten";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const baseProps = {
	lineNum: 1,
	isSelected: false,
	isMatch: false,
	isFocus: false,
	onToggle: vi.fn(),
	onSelect: vi.fn(),
	onCopy: vi.fn(),
};

const openObjRow: Row = {
	kind: "open",
	path: "root",
	depth: 0,
	key: null,
	type: "object",
	count: 2,
	isLast: true,
	collapsed: false,
	value: { a: 1 },
};

const openArrRow: Row = {
	kind: "open",
	path: "root",
	depth: 0,
	key: "items",
	type: "array",
	count: 3,
	isLast: false,
	collapsed: true,
	value: [1, 2, 3],
};

const closeRow: Row = {
	kind: "close",
	path: "root__close",
	depth: 0,
	type: "object",
	isLast: true,
};

const primString: Row = {
	kind: "prim",
	path: "root.name",
	depth: 1,
	key: "name",
	value: "Alice",
	isLast: false,
};

const primNumber: Row = {
	kind: "prim",
	path: "root.age",
	depth: 1,
	key: "age",
	value: 30,
	isLast: true,
};

const primNull: Row = {
	kind: "prim",
	path: "root.x",
	depth: 1,
	key: "x",
	value: null,
	isLast: true,
};

const primTrue: Row = {
	kind: "prim",
	path: "root.flag",
	depth: 1,
	key: "flag",
	value: true,
	isLast: true,
};

const primFalse: Row = {
	kind: "prim",
	path: "root.active",
	depth: 1,
	key: "active",
	value: false,
	isLast: true,
};

describe("TreeRow", () => {
	it("renders an open object row", () => {
		render(<TreeRow {...baseProps} row={openObjRow} />);
		expect(screen.getByText("{")).toBeTruthy();
	});

	it("renders a collapsed open array row with pill", () => {
		render(<TreeRow {...baseProps} row={openArrRow} />);
		expect(screen.getByText("3 items")).toBeTruthy();
	});

	it("renders a close row", () => {
		const { container } = render(<TreeRow {...baseProps} row={closeRow} />);
		expect(container.querySelector(".copy-btn")).toBeNull();
		expect(container.textContent).toContain("}");
	});

	it("renders a prim string row", () => {
		render(<TreeRow {...baseProps} row={primString} />);
		expect(screen.getByText(/"Alice"/)).toBeTruthy();
	});

	it("renders a prim number row", () => {
		render(<TreeRow {...baseProps} row={primNumber} />);
		expect(screen.getByText("30")).toBeTruthy();
	});

	it("renders a prim null row", () => {
		render(<TreeRow {...baseProps} row={primNull} />);
		expect(screen.getByText("null")).toBeTruthy();
	});

	it("renders prim true", () => {
		render(<TreeRow {...baseProps} row={primTrue} />);
		expect(screen.getByText("true")).toBeTruthy();
	});

	it("renders prim false", () => {
		render(<TreeRow {...baseProps} row={primFalse} />);
		expect(screen.getByText("false")).toBeTruthy();
	});

	it("calls onSelect when row is clicked", () => {
		const onSelect = vi.fn();
		render(<TreeRow {...baseProps} row={primString} onSelect={onSelect} />);
		fireEvent.click(screen.getByRole("treeitem"));
		expect(onSelect).toHaveBeenCalledWith("root.name");
	});

	it("calls onSelect on Enter/Space keydown", () => {
		const onSelect = vi.fn();
		render(<TreeRow {...baseProps} row={primString} onSelect={onSelect} />);
		fireEvent.keyDown(screen.getByRole("treeitem"), { key: "Enter" });
		expect(onSelect).toHaveBeenCalled();
		fireEvent.keyDown(screen.getByRole("treeitem"), { key: " " });
		expect(onSelect).toHaveBeenCalledTimes(2);
	});

	it("calls onCopy and shows copied state on copy button click", async () => {
		const onCopy = vi.fn();
		render(<TreeRow {...baseProps} row={primString} onCopy={onCopy} />);
		const copyBtn = document.querySelector(".copy-btn") as HTMLButtonElement;
		await act(async () => {
			fireEvent.click(copyBtn);
		});
		expect(onCopy).toHaveBeenCalledWith("Alice");
		expect(copyBtn.className).toContain("ok");
	});

	it("calls onCopy with value for open row", async () => {
		const onCopy = vi.fn();
		render(<TreeRow {...baseProps} row={openObjRow} onCopy={onCopy} />);
		const copyBtn = document.querySelector(".copy-btn") as HTMLButtonElement;
		await act(async () => {
			fireEvent.click(copyBtn);
		});
		expect(onCopy).toHaveBeenCalledWith({ a: 1 });
	});

	it("calls onToggle when toggle button clicked", () => {
		const onToggle = vi.fn();
		render(<TreeRow {...baseProps} row={openObjRow} onToggle={onToggle} />);
		const togBtn = document.querySelector(".tog") as HTMLButtonElement;
		fireEvent.click(togBtn);
		expect(onToggle).toHaveBeenCalledWith("root");
	});

	it("applies selected class when isSelected", () => {
		render(<TreeRow {...baseProps} row={primString} isSelected={true} />);
		expect(screen.getByRole("treeitem").className).toContain("sel");
	});

	it("applies hit and hit-focus classes", () => {
		render(
			<TreeRow {...baseProps} row={primString} isMatch={true} isFocus={true} />,
		);
		const item = screen.getByRole("treeitem");
		expect(item.className).toContain("hit");
		expect(item.className).toContain("hit-focus");
	});

	it("selects open path for close rows", () => {
		const onSelect = vi.fn();
		render(<TreeRow {...baseProps} row={closeRow} onSelect={onSelect} />);
		fireEvent.click(screen.getByRole("treeitem"));
		expect(onSelect).toHaveBeenCalledWith("root");
	});

	it("expands collapsed row on pill click", () => {
		const onToggle = vi.fn();
		render(<TreeRow {...baseProps} row={openArrRow} onToggle={onToggle} />);
		const pill = document.querySelector(".pill") as HTMLButtonElement;
		fireEvent.click(pill);
		expect(onToggle).toHaveBeenCalledWith("root");
	});
});
