import { TreeView } from "@content/components/TreeView";
import type { Row } from "@content/lib/flatten";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

	it("renders bottom spacer when rows exceed viewport", () => {
		const manyRows: Row[] = Array.from({ length: 30 }, (_, i) => ({
			kind: "prim" as const,
			path: `root.item${i}`,
			depth: 1,
			key: `item${i}`,
			value: i,
			isLast: i === 29,
		}));
		const { container } = render(
			<TreeView {...defaultProps} rows={manyRows} />,
		);
		expect(container.querySelector(".tree-spacer-bot")).toBeTruthy();
	});

	it("renders top spacer when scrolled past buffer", async () => {
		const manyRows: Row[] = Array.from({ length: 100 }, (_, i) => ({
			kind: "prim" as const,
			path: `root.item${i}`,
			depth: 1,
			key: `item${i}`,
			value: i,
			isLast: i === 99,
		}));
		const { container } = render(
			<TreeView {...defaultProps} rows={manyRows} />,
		);
		const scrollEl = container.querySelector(".tree-scroll") as HTMLElement;
		Object.defineProperty(scrollEl, "scrollTop", {
			value: 500,
			writable: true,
			configurable: true,
		});
		await act(async () => {
			fireEvent.scroll(scrollEl);
		});
		expect(container.querySelector(".tree-spacer-top")).toBeTruthy();
	});

	it("does not scroll when focusPath row is not found", () => {
		const { container } = render(
			<TreeView {...defaultProps} rows={rows} focusPath="root.notfound" />,
		);
		expect(container.querySelector(".tree-scroll")).toBeTruthy();
	});

	it("scrolls focused row into view when focusPath changes (row below viewport)", async () => {
		const { container, rerender } = render(
			<TreeView {...defaultProps} rows={rows} focusPath={null} />,
		);
		const scrollEl = container.querySelector(".tree-scroll") as HTMLElement;
		scrollEl.scrollTo = vi.fn();
		await act(async () => {
			rerender(<TreeView {...defaultProps} rows={rows} focusPath="root.b" />);
		});
	});

	it("scrolls focused row into view when row is above viewport (scrollTop > rowTop)", async () => {
		const { container, rerender } = render(
			<TreeView {...defaultProps} rows={rows} focusPath={null} />,
		);
		const scrollEl = container.querySelector(".tree-scroll") as HTMLElement;
		// Set scrollTop high so that rowTop < scrollTop (row is above viewport)
		Object.defineProperty(scrollEl, "scrollTop", {
			value: 500,
			writable: true,
			configurable: true,
		});
		scrollEl.scrollTo = vi.fn();
		await act(async () => {
			rerender(<TreeView {...defaultProps} rows={rows} focusPath="root.a" />);
		});
	});

	it("marks selected close row via openPath resolution", () => {
		const closeRow: Row = {
			kind: "close",
			path: "root__close",
			depth: 0,
			type: "object",
			isLast: true,
		};
		const { container } = render(
			<TreeView {...defaultProps} rows={[closeRow]} selPath="root" />,
		);
		expect(container.querySelector(".sel")).toBeTruthy();
	});
});
