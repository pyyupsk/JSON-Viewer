import { BottomBar } from "@content/components/BottomBar";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("BottomBar", () => {
	it("renders valid state", () => {
		render(
			<BottomBar valid={true} sizeKb="1.2" lineCount={42} selPath={null} />,
		);
		expect(screen.getByText(/valid/)).toBeTruthy();
		expect(screen.getByText("1.2 KB")).toBeTruthy();
		expect(screen.getByText("42 lines")).toBeTruthy();
		expect(screen.getByText("root")).toBeTruthy();
	});

	it("renders invalid state", () => {
		render(
			<BottomBar valid={false} sizeKb="0.5" lineCount={1} selPath={null} />,
		);
		expect(screen.getByText(/invalid JSON/)).toBeTruthy();
	});

	it("renders selected path", () => {
		render(
			<BottomBar
				valid={true}
				sizeKb="1.0"
				lineCount={5}
				selPath="root.items[0]"
			/>,
		);
		expect(screen.getByText("root.items[0]")).toBeTruthy();
	});
});
