import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RawView } from "../../entrypoints/content/components/RawView";

describe("RawView", () => {
	it("renders content in a readonly textarea", () => {
		render(<RawView content='{"foo": "bar"}' />);
		const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
		expect(textarea.value).toBe('{"foo": "bar"}');
		expect(textarea.readOnly).toBe(true);
	});
});
