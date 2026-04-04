import { describe, expect, it } from "vitest";
import {
	CollapseIcon,
	CollapseNodeIcon,
	CopiedIcon,
	CopyIcon,
	ExpandIcon,
	ExpandNodeIcon,
	InvalidIcon,
	NextIcon,
	PrevIcon,
	RunIcon,
	ValidIcon,
} from "../../entrypoints/content/components/Icons";

describe("Icons", () => {
	it("exports string constants", () => {
		expect(CollapseIcon).toBe("⊟");
		expect(ExpandIcon).toBe("⊞");
		expect(CopyIcon).toBe("⎘");
		expect(CopiedIcon).toBe("✓");
		expect(RunIcon).toBe("▶");
		expect(PrevIcon).toBe("▲");
		expect(NextIcon).toBe("▼");
		expect(CollapseNodeIcon).toBe("−");
		expect(ExpandNodeIcon).toBe("+");
		expect(ValidIcon).toBe("●");
		expect(InvalidIcon).toBe("✗");
	});
});
