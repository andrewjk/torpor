import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import importComponent from "../importComponent";

// A child component with a @style block appends <style> to t_head during the
// server render. If a LATER sibling inside the @try throws, the discarded
// partial try output must include those head tags — the snapshot/restore
// covers t_head, not just t_body.
const trySource = `
function Styled() {
	@render {
		<span>styled</span>
	}

	@style {
		span {
			color: red;
		}
	}
}

export default function TryHeadDiscard($props: { danger: boolean }) {
	function boom() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	@render {
		@try {
			<Styled />
			<p>{boom()}</p>
		} catch (err) {
			<p class="error">Caught: {err.message}</p>
		}
	}
}
`;

test("server @try discards head tags appended before the throw", async () => {
	const serverComponent = await importComponent(import.meta.filename, trySource, "server");

	const { body, head } = await serverComponent({ danger: true });

	// The partial try output (including the child's style) was discarded
	expect(head).not.toContain("<style");
	expect(body).not.toContain("styled");
	expect(body).toContain("Caught: boom");
});

test("server @try keeps head tags when nothing throws", async () => {
	const serverComponent = await importComponent(import.meta.filename, trySource, "server");

	const { body, head } = await serverComponent({ danger: false });

	expect(head).toContain("<style");
	expect(body).toContain("styled");
	expect(body).not.toContain("Caught:");
});

// The same shape for a top-level @error block
const errorSource = `
function Styled2() {
	@render {
		<span>styled</span>
	}

	@style {
		span {
			color: blue;
		}
	}
}

export default function ErrorHeadDiscard($props: { danger: boolean }) {
	function boom() {
		if ($props.danger) throw new Error("boom");
		return true;
	}

	@render {
		<Styled2 />
		@if (boom()) {
			<p>All good</p>
		}
	}

	@error (err) {
		<p class="error">Oops: {err.message}</p>
	}
}
`;

test("server @error discards head tags appended before the throw", async () => {
	const serverComponent = await importComponent(import.meta.filename, errorSource, "server");

	const { body, head } = await serverComponent({ danger: true });

	expect(head).not.toContain("<style");
	expect(body).not.toContain("styled");
	expect(body).toContain("Oops: boom");
});

test("server @error keeps head tags when nothing throws", async () => {
	const serverComponent = await importComponent(import.meta.filename, errorSource, "server");

	const { body, head } = await serverComponent({ danger: false });

	expect(head).toContain("<style");
	expect(body).toContain("styled");
});
