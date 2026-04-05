import { ErrorBoundary } from "@content/components/ErrorBoundary";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function Bomb(): never {
	throw new Error("test explosion");
}

describe("ErrorBoundary", () => {
	it("renders children when there is no error", () => {
		render(
			<ErrorBoundary>
				<span>ok</span>
			</ErrorBoundary>,
		);
		expect(screen.getByText("ok")).toBeTruthy();
	});

	it("renders fallback when a child throws", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(
			<ErrorBoundary>
				<Bomb />
			</ErrorBoundary>,
		);
		expect(screen.getByText(/encountered an error/i)).toBeTruthy();
		expect(screen.getByText("test explosion")).toBeTruthy();
		spy.mockRestore();
	});
});
