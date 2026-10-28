import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrate from "../../src/render/hydrate";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";

// Server and client conditions can legitimately differ: anything read from
// `localStorage`, `matchMedia` or another browser-only API (or a `$run` that
// no-ops on the server) can make the client pick a different `@if`/`@switch`
// branch than the server rendered. Hydration must recreate the client's
// branch -- clearing the server's markup and inserting fresh DOM -- instead
// of silently adopting the server's branch content.
//
// The server writes the branch it rendered into the block's hydration marker
// (`<!^2>`), and the client compares it with the branch it picks.

const source = `
export default function IfHydrationBranchMismatch($props: { on: boolean }) {
	@render {
		<span class="badge" data-on={$props.on}>
			@if ($props.on) {
				<span class="icon minus">minus</span>
			} else {
				<span class="icon plus">plus</span>
			}
		</span>
	}
}
`;

async function hydrateWith(source2: string, serverProps: any, clientProps: any) {
	const clientComponent = await importComponent(import.meta.filename, source2, "client");
	const serverComponent = await importComponent(import.meta.filename, source2, "server");

	const { body } = await serverComponent(serverProps);
	const container = document.createElement("div");
	container.innerHTML = body;
	container.ownerDocument.body.appendChild(container);

	hydrate(container, clientComponent, clientProps);
	return container;
}

test("if branch mismatch -- client picks the other branch than the server", async () => {
	// Server rendered `on: false` (plus); the client hydrates with `on: true`
	const state = $watch({ on: true });
	const container = await hydrateWith(source, { on: false }, state);

	expect(container.querySelector("[data-on]")?.getAttribute("data-on")).toBe("true");
	expect(queryByText(container, "minus")).not.toBeNull();
	expect(queryByText(container, "plus")).toBeNull();

	// And the branch keeps working afterwards
	state.on = false;
	expect(queryByText(container, "plus")).not.toBeNull();
	expect(queryByText(container, "minus")).toBeNull();

	state.on = true;
	expect(queryByText(container, "minus")).not.toBeNull();
	expect(queryByText(container, "plus")).toBeNull();
});

test("if branch mismatch -- the other way around", async () => {
	// Server rendered `on: true` (minus); the client hydrates with `on: false`
	const state = $watch({ on: false });
	const container = await hydrateWith(source, { on: true }, state);

	// `data-on={false}` removes the boolean attribute
	expect(container.querySelector(".badge")?.hasAttribute("data-on")).toBe(false);
	expect(queryByText(container, "plus")).not.toBeNull();
	expect(queryByText(container, "minus")).toBeNull();

	state.on = true;
	expect(queryByText(container, "minus")).not.toBeNull();
	expect(queryByText(container, "plus")).toBeNull();
});

test("if branch mismatch -- server branch removed when the client matches nothing", async () => {
	const noElseSource = `
export default function IfHydrationBranchMismatch($props: { on: boolean }) {
	@render {
		@if ($props.on) {
			<p>only when on</p>
		}
	}
}
`;

	// Server rendered the branch; the client's condition is false and there
	// is no else branch, so the content must be removed
	const state = $watch({ on: false });
	const container = await hydrateWith(noElseSource, { on: true }, state);

	expect(queryByText(container, "only when on")).toBeNull();

	state.on = true;
	expect(queryByText(container, "only when on")).not.toBeNull();
});

test("if branch mismatch -- client branch inserted when the server rendered nothing", async () => {
	const noElseSource = `
export default function IfHydrationBranchMismatch($props: { on: boolean }) {
	@render {
		@if ($props.on) {
			<p>only when on</p>
		}
	}
}
`;

	// The server matched no branch (empty block); the client's condition is
	// true, so the content must be inserted
	const state = $watch({ on: true });
	const container = await hydrateWith(noElseSource, { on: false }, state);

	expect(queryByText(container, "only when on")).not.toBeNull();

	state.on = false;
	expect(queryByText(container, "only when on")).toBeNull();
});

test("switch branch mismatch -- client picks a different case than the server", async () => {
	const switchSource = `
export default function IfHydrationBranchMismatch($props: { value: number }) {
	@render {
		@switch ($props.value) {
			case 1: {
				<p>first</p>
			}
			case 2: {
				<p>second</p>
			}
			default: {
				<p>other</p>
			}
		}
	}
}
`;

	const state = $watch({ value: 2 });
	const container = await hydrateWith(switchSource, { value: 1 }, state);

	expect(queryByText(container, "second")).not.toBeNull();
	expect(queryByText(container, "first")).toBeNull();

	state.value = 1;
	expect(queryByText(container, "first")).not.toBeNull();
	expect(queryByText(container, "second")).toBeNull();
});

test("matching branches still adopt the server's markup", async () => {
	// Same condition on both sides: the common case. The server's markup is
	// adopted, not recreated
	const state = $watch({ on: false });
	const container = await hydrateWith(source, { on: false }, state);

	expect(queryByText(container, "plus")).not.toBeNull();
	expect(queryByText(container, "minus")).toBeNull();

	state.on = true;
	expect(queryByText(container, "minus")).not.toBeNull();
	expect(queryByText(container, "plus")).toBeNull();
});
