// @vitest-environment node
import { expect, test } from "vite-plus/test";
import getId from "../src/utils/getId";

test("on the server, ids are counted per render", () => {
	// Each request's page state scopes its render's ids
	const first = { $page: {} };
	const second = { $page: {} };

	expect(getId(first)).toBe("torp-id-0");
	expect(getId(second)).toBe("torp-id-0");
	// A child's context is a copy, but shares the same page state
	expect(getId({ ...first, extra: true })).toBe("torp-id-1");
	expect(getId(second)).toBe("torp-id-1");

	// The next request renders the same ids again
	const third = { $page: {} };
	expect(getId(third)).toBe("torp-id-0");
	expect(getId(third)).toBe("torp-id-1");
});

test("without page state, the server falls back to one counter", () => {
	const a = getId();
	const b = getId({});
	expect(a).not.toBe(b);
});
