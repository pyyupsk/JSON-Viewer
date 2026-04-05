// @vitest-environment happy-dom
import { TypeScriptView } from "@content/components/TypeScriptView";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const data = { name: "Alice", age: 30 };

describe("TypeScriptView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders a textarea with type output", () => {
		render(<TypeScriptView data={data} name="Root" />);
		const textarea = screen.getByRole("textbox");
		expect(textarea).toBeTruthy();
		expect((textarea as HTMLTextAreaElement).value).toContain("type Root =");
	});

	it("defaults to extracted mode — toggle label is 'Inline'", () => {
		render(<TypeScriptView data={data} name="Root" />);
		const btn = screen.getByRole("button");
		expect(btn.textContent).toBe("Inline");
	});

	it("switches to inline mode on toggle click — label becomes 'Extracted'", () => {
		render(<TypeScriptView data={data} name="Root" />);
		const btn = screen.getByRole("button");
		fireEvent.click(btn);
		expect(btn.textContent).toBe("Extracted");
	});

	it("output changes when toggling between extracted and inline", () => {
		const nestedData = { author: { name: "Ada" } };
		render(<TypeScriptView data={nestedData} name="Root" />);
		const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
		const extractedOutput = textarea.value;

		fireEvent.click(screen.getByRole("button"));
		const inlineOutput = textarea.value;

		expect(extractedOutput).not.toBe(inlineOutput);
		// Extracted has a separate type declaration
		expect(extractedOutput).toContain("type Author =");
		// Inline does not
		expect(inlineOutput).not.toContain("type Author =");
	});
});
