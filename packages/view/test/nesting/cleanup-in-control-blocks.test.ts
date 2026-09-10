import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeEach, expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

declare global {
	interface Window {
		__cleanupLog: string[];
	}
}

beforeEach(() => {
	window.__cleanupLog = [];
});

// --- Single @if with child component that has a $run cleanup ---

const sourceIfChild = `
export default function CleanupIfChild($props: { show: boolean }) {
	@render {
		@if ($props.show) {
			<CleanupTracker />
		} else {
			<p>Hidden</p>
		}
	}
}

function CleanupTracker() {
	$run(() => {
		window.__cleanupLog.push("effect");
		return () => {
			window.__cleanupLog.push("cleanup");
		};
	});

	@render {
		<p>Tracked</p>
	}
}
`;

test("child component cleanup when @if becomes false -- mounted", async () => {
	let $state = $watch({ show: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceIfChild, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Tracked")).not.toBeNull();
	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.show = false;

	expect(queryByText(container, "Tracked")).toBeNull();
	expect(queryByText(container, "Hidden")).not.toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

test("child component cleanup when @if becomes false -- hydrated", async () => {
	let $state = $watch({ show: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, sourceIfChild, "client");
	const serverComponent = await importComponent(import.meta.filename, sourceIfChild, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Tracked")).not.toBeNull();
	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.show = false;

	expect(queryByText(container, "Hidden")).not.toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

// --- Nested @if: outer toggle should clean up inner child ---

const sourceNestedChild = `
export default function CleanupNestedChild($props: { outer: boolean; inner: boolean }) {
	@render {
		@if ($props.outer) {
			@if ($props.inner) {
				<CleanupTracker />
			} else {
				<p>Inner hidden</p>
			}
		} else {
			<p>Outer hidden</p>
		}
	}
}

function CleanupTracker() {
	$run(() => {
		window.__cleanupLog.push("effect");
		return () => {
			window.__cleanupLog.push("cleanup");
		};
	});

	@render {
		<p>Tracked</p>
	}
}
`;

test("child cleanup when nested outer @if becomes false -- mounted", async () => {
	let $state = $watch({ outer: true, inner: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceNestedChild, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Tracked")).not.toBeNull();
	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.outer = false;

	expect(queryByText(container, "Outer hidden")).not.toBeNull();
	expect(queryByText(container, "Tracked")).toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

test("child cleanup when nested outer @if becomes false -- hydrated", async () => {
	let $state = $watch({ outer: true, inner: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, sourceNestedChild, "client");
	const serverComponent = await importComponent(import.meta.filename, sourceNestedChild, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Tracked")).not.toBeNull();
	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.outer = false;

	expect(queryByText(container, "Outer hidden")).not.toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

test("child cleanup when nested inner @if becomes false -- mounted", async () => {
	let $state = $watch({ outer: true, inner: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceNestedChild, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Tracked")).not.toBeNull();
	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.inner = false;

	expect(queryByText(container, "Inner hidden")).not.toBeNull();
	expect(queryByText(container, "Tracked")).toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

test("child cleanup when nested inner @if becomes false -- hydrated", async () => {
	let $state = $watch({ outer: true, inner: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, sourceNestedChild, "client");
	const serverComponent = await importComponent(import.meta.filename, sourceNestedChild, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Tracked")).not.toBeNull();
	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.inner = false;

	expect(queryByText(container, "Inner hidden")).not.toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

// --- @for with child component cleanup ---

const sourceForChild = `
export default function CleanupForChild($props: { items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<CleanupTracker />
			}
		</ul>
	}
}

function CleanupTracker() {
	$run(() => {
		window.__cleanupLog.push("effect");
		return () => {
			window.__cleanupLog.push("cleanup");
		};
	});

	@render {
		<p>Tracked</p>
	}
}
`;

test("child cleanup when @for list shrinks -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceForChild, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(3);

	$state.items = ["a"];

	expect(window.__cleanupLog.filter((x) => x === "cleanup").length).toBe(2);
});

test("child cleanup when @for list shrinks -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, sourceForChild, "client");
	const serverComponent = await importComponent(import.meta.filename, sourceForChild, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(3);

	$state.items = ["a"];

	expect(window.__cleanupLog.filter((x) => x === "cleanup").length).toBe(2);
});

test("child cleanup when @for list emptied -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceForChild, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(3);

	$state.items = [];

	expect(window.__cleanupLog.filter((x) => x === "cleanup").length).toBe(3);
});

// --- @switch with child component cleanup ---

const sourceSwitchChild = `
export default function CleanupSwitchChild($props: { mode: string }) {
	@render {
		@switch ($props.mode) {
			case "a": {
				<CleanupTracker />
			}
			case "b": {
				<CleanupTracker />
			}
			default: {
				<p>Default</p>
			}
		}
	}
}

function CleanupTracker() {
	$run(() => {
		window.__cleanupLog.push("effect");
		return () => {
			window.__cleanupLog.push("cleanup");
		};
	});

	@render {
		<p>Tracked</p>
	}
}
`;

test("child cleanup when @switch case changes -- mounted", async () => {
	let $state = $watch({ mode: "a" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceSwitchChild, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.mode = "b";

	expect(window.__cleanupLog).toContain("cleanup");
	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(2);
});

test("child cleanup when @switch case changes -- hydrated", async () => {
	let $state = $watch({ mode: "a" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, sourceSwitchChild, "client");
	const serverComponent = await importComponent(import.meta.filename, sourceSwitchChild, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.mode = "b";

	expect(window.__cleanupLog).toContain("cleanup");
	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(2);
});

test("child cleanup when @switch falls to default -- mounted", async () => {
	let $state = $watch({ mode: "a" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceSwitchChild, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.mode = "unknown";

	expect(window.__cleanupLog).toContain("cleanup");
	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(1);
});

// --- Deeply nested @if: 3 levels, toggle top ---

const sourceDeepChild = `
export default function CleanupDeepChild($props: { a: boolean; b: boolean; c: boolean }) {
	@render {
		@if ($props.a) {
			@if ($props.b) {
				@if ($props.c) {
					<CleanupTracker />
				}
			}
		}
	}
}

function CleanupTracker() {
	$run(() => {
		window.__cleanupLog.push("effect");
		return () => {
			window.__cleanupLog.push("cleanup");
		};
	});

	@render {
		<p>Tracked</p>
	}
}
`;

test("child cleanup when top of 3-level @if becomes false -- mounted", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceDeepChild, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.a = false;

	expect(queryByText(container, "Tracked")).toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

test("child cleanup when top of 3-level @if becomes false -- hydrated", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, sourceDeepChild, "client");
	const serverComponent = await importComponent(import.meta.filename, sourceDeepChild, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.a = false;

	expect(queryByText(container, "Tracked")).toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

test("child cleanup when middle of 3-level @if becomes false -- mounted", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceDeepChild, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.b = false;

	expect(queryByText(container, "Tracked")).toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

test("child cleanup when inner of 3-level @if becomes false -- mounted", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceDeepChild, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog).toEqual(["effect"]);

	$state.c = false;

	expect(queryByText(container, "Tracked")).toBeNull();
	expect(window.__cleanupLog).toContain("cleanup");
});

// --- @if inside @for: toggle removes @if, should clean up child ---

const sourceIfInsideFor = `
export default function CleanupIfInsideFor($props: { show: boolean; items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				@if ($props.show) {
					<CleanupTracker />
				}
			}
		</ul>
	}
}

function CleanupTracker() {
	$run(() => {
		window.__cleanupLog.push("effect");
		return () => {
			window.__cleanupLog.push("cleanup");
		};
	});

	@render {
		<p>Tracked</p>
	}
}
`;

test("child cleanup when @if inside @for becomes false -- mounted", async () => {
	let $state = $watch({ show: true, items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceIfInsideFor, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(3);

	$state.show = false;

	expect(window.__cleanupLog.filter((x) => x === "cleanup").length).toBe(3);
});

test("child cleanup when @if inside @for becomes false -- hydrated", async () => {
	let $state = $watch({ show: true, items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, sourceIfInsideFor, "client");
	const serverComponent = await importComponent(import.meta.filename, sourceIfInsideFor, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(3);

	$state.show = false;

	expect(window.__cleanupLog.filter((x) => x === "cleanup").length).toBe(3);
});

test("child cleanup when @for removes items with @if inside -- mounted", async () => {
	let $state = $watch({ show: true, items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceIfInsideFor, "client");
	mountComponent(container, component, $state);

	expect(window.__cleanupLog.filter((x) => x === "effect").length).toBe(3);

	$state.items = ["a"];

	expect(window.__cleanupLog.filter((x) => x === "cleanup").length).toBe(2);
});
