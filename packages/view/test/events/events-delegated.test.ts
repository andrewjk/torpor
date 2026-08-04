import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

// Smoke test: delegated click handler still fires.
const clickSource = `
export default function DelegatedClick() {
	let $state = $watch({ count: 0 });

	@render {
		<button id="btn" onclick={() => { $state.count++; }}>
			Count: {$state.count}
		</button>
	}
}
`;

// Walk-up test: clicking a child element inside a parent with a delegated
// handler must fire the parent's handler. This is the structural property
// delegation introduces — the document-level listener walks up from
// event.target to find the closest ancestor with a stashed handler.
const walkUpSource = `
export default function WalkUp() {
	let $state = $watch({ clicked: false });

	@render {
		<div id="outer" onclick={() => { $state.clicked = true; }}>
			<span id="inner">click me</span>
		</div>
		@if ($state.clicked) {
			<p>Clicked!</p>
		}
	}
}
`;

// Non-bubbling fallback test: events not in the delegated set (e.g. custom
// non-bubbling events) must still use direct addEventListener on the element.
// We use a custom event name the compiler will pass through verbatim.
const nonBubblingSource = `
export default function NonBubbling() {
	let $state = $watch({ fired: false });

	@render {
		<button id="btn" onmycustomevent={() => { $state.fired = true; }}>
			Fire
		</button>
		@if ($state.fired) {
			<p>Fired!</p>
		}
	}
}
`;

test("delegated click handler fires (mounted)", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, clickSource, "client");
	mountComponent(container, component);

	const btn = container.querySelector("#btn")!;
	await userEvent.click(btn);

	expect(queryByText(container, "Count: 1")).not.toBeNull();
});

test("delegated click handler fires (hydrated)", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, clickSource, "client");
	const serverComponent = await importComponent(import.meta.filename, clickSource, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	const btn = container.querySelector("#btn")!;
	await userEvent.click(btn);

	expect(queryByText(container, "Count: 1")).not.toBeNull();
});

test("delegated click does not call Element.prototype.addEventListener per element", async () => {
	// Spy on Element.prototype.addEventListener — delegated events should
	// never reach this method. (Document.prototype.addEventListener is a
	// different method and IS expected to be called once per delegated type.)
	const spy = vi.spyOn(Element.prototype, "addEventListener");

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, clickSource, "client");
	mountComponent(container, component);

	// No element-level addEventListener call for "click" — that's the win.
	const clickCalls = spy.mock.calls.filter(([type]) => type === "click");
	expect(clickCalls).toHaveLength(0);
});

test("delegated handler fires when clicking a child of the handler element", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, walkUpSource, "client");
	mountComponent(container, component);

	// Click the inner span — the handler is on the outer div. Without the
	// walk-up, the document-level listener would not find a handler on the
	// span and nothing would fire.
	const inner = container.querySelector("#inner")!;
	await userEvent.click(inner);

	expect(queryByText(container, "Clicked!")).not.toBeNull();
});

test("non-bubbling event types fall back to direct addEventListener", async () => {
	// "mycustomevent" is not in DELEGATED_EVENT_TYPES, so the runtime must
	// use Element.prototype.addEventListener — preserving semantics for any
	// event type the user names.
	const spy = vi.spyOn(Element.prototype, "addEventListener");

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, nonBubblingSource, "client");
	mountComponent(container, component);

	const customCalls = spy.mock.calls.filter(([type]) => type === "mycustomevent");
	expect(customCalls).toHaveLength(1);

	// Dispatch the event manually (testing-library has no helper for custom
	// events) and verify the handler fires.
	const btn = container.querySelector("#btn")!;
	btn.dispatchEvent(new Event("mycustomevent", { bubbles: false }));

	expect(queryByText(container, "Fired!")).not.toBeNull();
});

test("delegated handler sees correct currentTarget", async () => {
	// Verify currentTarget is re-synthesized to point at the handler element
	// (not `document`). Click the inner span so event.target !== currentTarget,
	// exercising the currentTarget re-synthesis path.
	// (Note: we don't check `this` because the source uses an arrow function,
	// and arrow functions don't bind `this` from `.call()` — same as with
	// direct addEventListener.)
	const source = `
		export default function CurrentTargetTest() {
			let $state = $watch({ currentTag: "" });

			@render {
				<button id="btn" onclick={(e) => {
					$state.currentTag = (e.currentTarget as HTMLElement).tagName;
				}}>
					<span>click</span>
				</button>
				<p>Current: {$state.currentTag}</p>
			}
		}
	`;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	const span = container.querySelector("#btn span")!;
	await userEvent.click(span);

	expect(queryByText(container, "Current: BUTTON")).not.toBeNull();
});
