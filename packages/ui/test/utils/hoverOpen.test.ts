import { afterEach, expect, test, vi } from "vite-plus/test";
import { createHoverOpen } from "../../src/utils/hoverOpen";

afterEach(() => {
	vi.useRealTimers();
});

test("cancel prevents a pending hover open", () => {
	vi.useFakeTimers();
	const open = vi.fn();
	const hover = createHoverOpen(open, () => false, 50);

	hover.handleMouseEnter();
	hover.cancel();
	vi.advanceTimersByTime(100);

	expect(open).not.toHaveBeenCalled();
});

test("a fired hover timer doesn't block the next hover", () => {
	vi.useFakeTimers();
	const open = vi.fn();
	const hover = createHoverOpen(open, () => false, 50);

	hover.handleMouseEnter();
	vi.advanceTimersByTime(60);
	expect(open).toHaveBeenCalledTimes(1);

	hover.handleMouseEnter();
	vi.advanceTimersByTime(60);
	expect(open).toHaveBeenCalledTimes(2);
});
