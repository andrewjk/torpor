import { mount } from "@torpor/view";
import { expect, test } from "vite-plus/test";
import { Progress } from "@torpor/ui/Progress?client";
import Solo from "torp-lib/Solo?client";

import { Widget } from "torp-lib/Widget?client";
import PackageHost from "./components/PackageHost.torp?client";

// Components from packages that ship .torp files (e.g. @torpor/ui or
// phosphor-torpor) are imported through bare specifiers that don't end in
// `.torp` -- either re-export barrels (dist/Widget/index.js) or export targets
// that point straight at a .torp file. With a ?client query, the override must
// reach the .torp files behind those specifiers, so that they can be mounted
// in a test project where components are SSR-compiled by default

test("client mount -- package re-export barrel mounts and reacts", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, Widget, { label: "From test" });

	const label = container.getElementsByClassName("widget-label")[0];
	expect(label).not.toBeNull();
	expect(label.textContent).toContain("From test: 0");

	// SSR-compiled components render nothing on mount, so reacting to a click
	// proves the client compile got through the barrel
	const button = container.getElementsByClassName("widget-increment")[0] as HTMLButtonElement;
	button.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(label.textContent).toContain("From test: 1");
});

test("client mount -- package export that points at a .torp file mounts", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, Solo, { text: "hello solo" });

	const solo = container.getElementsByClassName("solo")[0];
	expect(solo).not.toBeNull();
	expect(solo.textContent).toContain("hello solo");
});

test("client mount -- @torpor/ui component mounts", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, Progress, { value: 42 });

	const bar = container.getElementsByClassName("torp-progress")[0];
	expect(bar).not.toBeNull();
	expect(bar.getAttribute("aria-valuenow")).toBe("42");
	const indicator = container.getElementsByClassName("torp-progress-bar")[0];
	expect(indicator).not.toBeNull();
});

test("client mount -- override propagates from a component to the packages it imports", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	// PackageHost imports torp-lib/Widget and @torpor/ui/Progress with no
	// query -- the ?client on this import must reach them through package
	// detection, or they'd be SSR-compiled and render nothing
	mount(container, PackageHost, {});

	const label = container.getElementsByClassName("widget-label")[0];
	expect(label).not.toBeNull();
	expect(label.textContent).toContain("From package: 0");

	const bar = container.getElementsByClassName("torp-progress")[0];
	expect(bar).not.toBeNull();
	expect(bar.getAttribute("aria-valuenow")).toBe("42");
});
