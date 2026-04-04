import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TreeView } from "../../entrypoints/content/components/TreeView";
import type { Row } from "../../entrypoints/content/flatten";

const defaultProps = {
	rows: [] as Row[],
	selPath: null,
	matchSet: new Set<string>(),
	focusPath: null,
	onToggle: vi.fn(),
	onSelect: vi.fn(),
	onCopy: vi.fn(),
};

const rows: Row[] = [
	{
		kind: "prim",
		path: "root.a",
		depth: 1,
		key: "a",
		value: 1,
		isLast: false,
	},
	{
		kind: "prim",
		path: "root.b",
		depth: 1,
		key: "b",
		value: 2,
		isLast: true,
	},
];

describe("TreeView", () => {
	it("renders empty tree with no rows", () => {
		const { container } = render(<TreeView {...defaultProps} />);
		expect(container.querySelector(".tree-scroll")).toBeTruthy();
	});

	it("renders rows", () => {
		const { container } = render(<TreeView {...defaultProps} rows={rows} />);
		const treeItems = container.querySelectorAll('[role="treeitem"]');
		expect(treeItems.length).toBe(2);
	});

	it("highlights matched rows", () => {
		const { container } = render(
			<TreeView {...defaultProps} rows={rows} matchSet={new Set(["root.a"])} />,
		);
		const hitRows = container.querySelectorAll(".hit");
		expect(hitRows.length).toBe(1);
	});

	it("marks focus row", () => {
		const { container } = render(
			<TreeView {...defaultProps} rows={rows} focusPath="root.b" />,
		);
		expect(container.querySelector(".hit-focus")).toBeTruthy();
	});

	it("marks selected row", () => {
		const { container } = render(
			<TreeView {...defaultProps} rows={rows} selPath="root.a" />,
		);
		expect(container.querySelector(".sel")).toBeTruthy();
	});

	it("triggers scroll event handling", () => {
		const { container } = render(<TreeView {...defaultProps} rows={rows} />);
		const scrollEl = container.querySelector(".tree-scroll") as HTMLElement;
		fireEvent.scroll(scrollEl);
	});
});
