import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import context from "../../src/render/context";
import hydrate from "../../src/render/hydrate";
import mount from "../../src/render/mount";
import newRegion from "../../src/render/newRegion";
import popRegion from "../../src/render/popRegion";
import pushRegion from "../../src/render/pushRegion";
import unmount from "../../src/render/unmount";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// The embed-in-a-live-page scenario: a host component is mounted (or
// hydrated) at the root, and an embed hydrates server-rendered markup inside
// it (e.g. from a host `$onmount`, as @torpor/embed's hydrateEmbed does).
// The embed's hydration must not replace the host's render context, and
// tearing the embed down must not tear the host down with it. Before the
// fix, `hydrate` clobbered `context.rootRegion`/`previousRegion`, and
// `unmount` cleared whatever root it found — the next host navigation could
// crash in `pushRegion` with
// `TypeError: Cannot read properties of null (reading 'nextRegion')`.

const hostSource = `
export default function NestedHost() {
	let $state = $watch({
		count: 0
	});

	function incrementCount() {
		$state.count++;
	}

	@render {
		<section id="host">
			<p id="count">Count: {$state.count}</p>
			<button id="inc" onclick={incrementCount}>+1</button>
			<div id="embed-target"></div>
		</section>
	}
}
`;

const embedSource = `
export default function NestedEmbed() {
	$onmount(() => {
		window.__nestedLog.push("embed-mount");
		return () => {
			window.__nestedLog.push("embed-cleanup");
		};
	});

	@render {
		<p id="embed">Embed</p>
	}
}
`;

test("hydrating inside a mounted host preserves the host context", async () => {
	(window as any).__nestedLog = [];

	const hostContainer = document.createElement("div");
	const host = await importComponent(import.meta.filename, hostSource, "client");
	mountComponent(hostContainer, host);

	const hostRoot = context.rootRegion;
	const hostPrevious = context.previousRegion;
	const hostActive = context.activeRegion;
	expect(hostRoot).not.toBeNull();

	// Paint the embed's server-rendered markup inside the live host, then
	// hydrate it (what hydrateEmbed does).
	const embedClient = await importComponent(import.meta.filename, embedSource, "client");
	const serverEmbed = await importComponent(import.meta.filename, embedSource, "server");
	const { body } = await serverEmbed();
	const target = hostContainer.querySelector("#embed-target") as HTMLElement;
	target.innerHTML = body;
	hydrate(target, embedClient);

	// The embed is alive...
	expect(target.querySelector("#embed")).not.toBeNull();
	expect((window as any).__nestedLog).toContain("embed-mount");

	// ...but the host's render context must be untouched.
	expect(context.rootRegion).toBe(hostRoot);
	expect(context.previousRegion).toBe(hostPrevious);
	expect(context.activeRegion).toBe(hostActive);

	// Tearing the embed down must leave the host's context alone.
	unmount(target);
	expect(target.querySelector("#embed")).toBeNull();
	expect(target.childElementCount).toBe(0);
	expect((window as any).__nestedLog).toContain("embed-cleanup");
	expect(context.rootRegion).toBe(hostRoot);
	expect(context.previousRegion).toBe(hostPrevious);
	expect(context.activeRegion).toBe(hostActive);

	// The host keeps working: its effects still run against its regions.
	(hostContainer.querySelector("#inc") as HTMLElement).click();
	expect(hostContainer.querySelector("#count")?.textContent).toContain("Count: 1");

	// And the navigation-shaped crash from the follow-up: pushing a region
	// into the host's chain must not find a null previousRegion.
	const region = newRegion();
	expect(() => pushRegion(region, true)).not.toThrow();
	popRegion(hostActive);

	unmount(hostContainer);
	expect(context.rootRegion).toBeNull();

	// The container is reusable afterwards (fresh root on mount).
	mountComponent(hostContainer, host);
	expect(hostContainer.querySelector("#host")).not.toBeNull();
	expect(context.rootRegion).not.toBeNull();
	expect(context.rootRegion).not.toBe(hostRoot);
	unmount(hostContainer);
});

test("hydrating inside a hydrated host preserves the host context", async () => {
	expect(context.rootRegion).toBeNull();

	const hostContainer = document.createElement("div");
	const hostClient = await importComponent(import.meta.filename, hostSource, "client");
	const hostServer = await importComponent(import.meta.filename, hostSource, "server");
	await hydrateComponent(hostContainer, hostClient, hostServer);

	const hostRoot = context.rootRegion;

	const embedClient = await importComponent(import.meta.filename, embedSource, "client");
	const serverEmbed = await importComponent(import.meta.filename, embedSource, "server");
	const { body } = await serverEmbed();
	const target = hostContainer.querySelector("#embed-target") as HTMLElement;
	target.innerHTML = body;
	hydrate(target, embedClient);

	expect(target.querySelector("#embed")).not.toBeNull();
	expect(context.rootRegion).toBe(hostRoot);

	unmount(target);
	expect(target.childElementCount).toBe(0);
	expect(context.rootRegion).toBe(hostRoot);
	expect(context.previousRegion).not.toBeNull();

	unmount(hostContainer);
	expect(context.rootRegion).toBeNull();
});

test("mounting inside a mounted host is scoped to its own tree", async () => {
	expect(context.rootRegion).toBeNull();
	(window as any).__nestedLog = [];

	const hostContainer = document.createElement("div");
	const host = await importComponent(import.meta.filename, hostSource, "client");
	mountComponent(hostContainer, host);

	const hostRoot = context.rootRegion;

	// What mountEmbed does: mount the embed into an empty nested element.
	const embedClient = await importComponent(import.meta.filename, embedSource, "client");
	const target = hostContainer.querySelector("#embed-target") as HTMLElement;
	mount(target, embedClient);

	expect(target.querySelector("#embed")).not.toBeNull();
	expect(context.rootRegion).toBe(hostRoot);

	// The embed's teardown disposes the embed only.
	unmount(target);
	expect(target.childElementCount).toBe(0);
	expect((window as any).__nestedLog).toContain("embed-cleanup");
	expect(context.rootRegion).toBe(hostRoot);
	expect(hostContainer.querySelector("#host")).not.toBeNull();

	// The host still works...
	(hostContainer.querySelector("#inc") as HTMLElement).click();
	expect(hostContainer.querySelector("#count")?.textContent).toContain("Count: 1");

	// ...and its teardown still resets the context and empties the container.
	unmount(hostContainer);
	expect(context.rootRegion).toBeNull();
	expect(hostContainer.childElementCount).toBe(0);
});
