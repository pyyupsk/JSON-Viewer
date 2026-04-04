import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

class MockResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

globalThis.ResizeObserver =
	MockResizeObserver as unknown as typeof ResizeObserver;

Object.defineProperty(navigator, "clipboard", {
	value: { writeText: vi.fn().mockResolvedValue(undefined) },
	writable: true,
	configurable: true,
});

Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn() as typeof Element.prototype.scrollTo;

globalThis.requestAnimationFrame = vi.fn((cb) => {
	cb(0);
	return 0;
});
