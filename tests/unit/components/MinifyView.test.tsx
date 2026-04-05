import { MinifyView } from "@content/components/MinifyView";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("MinifyView", () => {
	it("renders minified JSON in a readonly textarea", () => {
		const data = { foo: "bar", count: 3 };
		render(<MinifyView data={data} />);
		const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
		expect(textarea.value).toBe(JSON.stringify(data));
		expect(textarea.readOnly).toBe(true);
	});
});
