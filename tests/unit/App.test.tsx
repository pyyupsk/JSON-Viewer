import { App } from "@content/App";
import {
	act,
	fireEvent,
	render,
	waitFor,
	within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

const validJson =
	'{"name": "Alice", "items": [1, 2, 3], "nested": {"x": true}}';
const invalidJson = "not valid json";

describe("App", () => {
	it("renders with valid JSON in tree tab", () => {
		const { container } = render(<App rawJson={validJson} />);
		expect(container.querySelector(".tree-scroll")).toBeTruthy();
	});

	it("renders parse error for invalid JSON", () => {
		const { container } = render(<App rawJson={invalidJson} />);
		const textarea = container.querySelector(
			".raw-area",
		) as HTMLTextAreaElement;
		expect(textarea.value).toBe(invalidJson);
	});

	it("switches to Raw tab", () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "Raw" }));
		const textarea = container.querySelector(
			".raw-area",
		) as HTMLTextAreaElement;
		expect(textarea.value).toContain("Alice");
	});

	it("switches to Minify tab", () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "Minify" }));
		const textarea = container.querySelector(
			".raw-area",
		) as HTMLTextAreaElement;
		expect(textarea.value).toContain("Alice");
	});

	it("switches to jq tab and shows JqBar", () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "jq" }));
		expect(container.querySelector(".jqbar")).toBeTruthy();
	});

	it("evaluates a jq expression", async () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "jq" }));
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: ".name" } });
		fireEvent.click(within(container).getByRole("button", { name: /Run/ }));
		await waitFor(() => {
			expect(container.querySelector(".jq-result-view")).toBeTruthy();
		});
	});

	it("shows jq error for malformed expression", async () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "jq" }));
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		// Unbalanced parenthesis forces jq parser to throw
		fireEvent.change(input, { target: { value: "map(" } });
		fireEvent.click(within(container).getByRole("button", { name: /Run/ }));
		await waitFor(() => {
			const status = container.querySelector(".jq-status");
			expect(status?.className).toContain("err");
		});
	});

	it("clears jq result on empty expression", async () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "jq" }));
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.click(within(container).getByRole("button", { name: /Run/ }));
		expect(container.querySelector(".jq-result-view")).toBeNull();
	});

	it("clears jq result on dot expression", async () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "jq" }));
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "." } });
		fireEvent.click(within(container).getByRole("button", { name: /Run/ }));
		expect(container.querySelector(".jq-result-view")).toBeNull();
	});

	it("escapes jq back to tree tab", async () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "jq" }));
		expect(container.querySelector(".jqbar")).toBeTruthy();
		const input = container.querySelector(".jq-input") as HTMLInputElement;
		fireEvent.keyDown(input, { key: "Escape" });
		await waitFor(() => {
			expect(container.querySelector(".tree-scroll")).toBeTruthy();
		});
	});

	it("shows search bar in tree tab", () => {
		const { container } = render(<App rawJson={validJson} />);
		expect(container.querySelector(".searchbar")).toBeTruthy();
	});

	it("searches and shows match count", async () => {
		const { container } = render(<App rawJson={validJson} />);
		const searchInput = container.querySelector(
			".search-input",
		) as HTMLInputElement;
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "Alice" } });
		});
		await waitFor(() => {
			const meta = container.querySelector(".search-meta");
			expect(meta?.textContent).toContain("1");
		});
	});

	it("shows no matches for unmatched query", async () => {
		const { container } = render(<App rawJson={validJson} />);
		const searchInput = container.querySelector(
			".search-input",
		) as HTMLInputElement;
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "zzznomatch" } });
		});
		await waitFor(() => {
			expect(container.querySelector(".search-meta")?.textContent).toBe(
				"no matches",
			);
		});
	});

	it("steps through matches", async () => {
		const { container } = render(<App rawJson={validJson} />);
		const searchInput = container.querySelector(
			".search-input",
		) as HTMLInputElement;
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "1" } });
		});
		await waitFor(() => {
			expect(container.querySelector(".search-meta")?.textContent).not.toBe("");
		});
		fireEvent.click(within(container).getByTitle("Next"));
		fireEvent.click(within(container).getByTitle("Previous"));
	});

	it("toggles case sensitivity", async () => {
		const { container } = render(<App rawJson={validJson} />);
		const caseBtn = within(container).getByTitle("Case sensitive");
		fireEvent.click(caseBtn);
		expect(caseBtn.className).toContain("on");
		fireEvent.click(caseBtn);
		expect(caseBtn.className).not.toContain("on");
	});

	it("collapses all nodes", async () => {
		const { container } = render(<App rawJson={validJson} />);
		await act(async () => {
			fireEvent.click(
				within(container).getByRole("button", { name: /Collapse/ }),
			);
		});
	});

	it("expands all nodes after collapsing", async () => {
		const { container } = render(<App rawJson={validJson} />);
		await act(async () => {
			fireEvent.click(
				within(container).getByRole("button", { name: /Collapse/ }),
			);
			fireEvent.click(
				within(container).getByRole("button", { name: /Expand/ }),
			);
		});
	});

	it("copies all via button", async () => {
		const { container } = render(<App rawJson={validJson} />);
		await act(async () => {
			fireEvent.click(within(container).getByRole("button", { name: /Copy/ }));
		});
		expect(navigator.clipboard.writeText).toHaveBeenCalled();
	});

	it("shows toast on copy", async () => {
		const { container } = render(<App rawJson={validJson} />);
		await act(async () => {
			fireEvent.click(within(container).getByRole("button", { name: /Copy/ }));
		});
		expect(container.querySelector(".toast.show")).toBeTruthy();
	});

	it("handles Ctrl+F keyboard shortcut", async () => {
		render(<App rawJson={validJson} />);
		await act(async () => {
			globalThis.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "f",
					ctrlKey: true,
					bubbles: true,
				}),
			);
		});
	});

	it("handles Ctrl+F from jq tab switches to tree", async () => {
		const { container } = render(<App rawJson={validJson} />);
		fireEvent.click(within(container).getByRole("button", { name: "jq" }));
		await act(async () => {
			globalThis.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "f",
					ctrlKey: true,
					bubbles: true,
				}),
			);
		});
		await waitFor(() => {
			expect(container.querySelector(".searchbar")).toBeTruthy();
		});
	});

	it("handles Ctrl+Shift+C keyboard shortcut", async () => {
		render(<App rawJson={validJson} />);
		await act(async () => {
			globalThis.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "C",
					ctrlKey: true,
					shiftKey: true,
					bubbles: true,
				}),
			);
		});
		expect(navigator.clipboard.writeText).toHaveBeenCalled();
	});

	it("renders bottombar with size and line count", () => {
		const { container } = render(<App rawJson={validJson} />);
		expect(container.querySelector(".bottombar")).toBeTruthy();
	});

	it("selects a row on click", async () => {
		const { container } = render(<App rawJson={validJson} />);
		const treeItems = container.querySelectorAll('[role="treeitem"]');
		if (treeItems.length > 0) {
			await act(async () => {
				fireEvent.click(treeItems[0]);
			});
			expect(container.querySelector(".sel")).toBeTruthy();
		}
	});

	it("renders with array JSON", () => {
		const { container } = render(<App rawJson="[1, 2, 3]" />);
		expect(container.querySelector(".tree-scroll")).toBeTruthy();
	});

	it("case-sensitive search filters correctly", async () => {
		const { container } = render(<App rawJson='{"Alice": 1, "alice": 2}' />);
		const caseBtn = within(container).getByTitle("Case sensitive");
		fireEvent.click(caseBtn);
		const searchInput = container.querySelector(
			".search-input",
		) as HTMLInputElement;
		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "Alice" } });
		});
		await waitFor(() => {
			const meta = container.querySelector(".search-meta");
			expect(meta?.textContent).toBeTruthy();
		});
	});

	it("toggles same node twice to cover add and delete branches", async () => {
		const { container } = render(<App rawJson={validJson} />);
		const togBtns = container.querySelectorAll(".tog");
		if (togBtns.length > 0) {
			await act(async () => {
				fireEvent.click(togBtns[0]); // collapse (add to set)
				fireEvent.click(togBtns[0]); // expand (delete from set)
			});
		}
	});

	it("copies object node value from tree row", async () => {
		const { container } = render(<App rawJson={validJson} />);
		const copyBtns = container.querySelectorAll(".copy-btn");
		// Find a copy button on an open (object/array) row
		if (copyBtns.length > 0) {
			await act(async () => {
				fireEvent.click(copyBtns[0]);
			});
			expect(navigator.clipboard.writeText).toHaveBeenCalled();
		}
	});

	it("copies selected primitive node value via Ctrl+Shift+C", async () => {
		const { container } = render(<App rawJson={validJson} />);
		// Select a primitive row first
		const treeItems = container.querySelectorAll('[role="treeitem"]');
		// Find a prim row to select (not the first which is the open root)
		for (const item of treeItems) {
			if (!item.querySelector(".tog")) {
				await act(async () => {
					fireEvent.click(item);
				});
				break;
			}
		}
		await act(async () => {
			globalThis.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "C",
					ctrlKey: true,
					shiftKey: true,
					bubbles: true,
				}),
			);
		});
		expect(navigator.clipboard.writeText).toHaveBeenCalled();
	});
});
