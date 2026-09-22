import { mount } from "@torpor/view";
import { expect, test } from "vite-plus/test";
import Counter from "./components/Counter.torp?client";

// Importing with a ?client query compiles the component (and any components
// it imports) for the client, even in a test project where components are
// SSR-compiled by default -- so SSR markup tests and client mount tests can
// coexist in one vitest project
test("client mount -- component mounts and reacts", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, Counter, { start: 5 });

	// The button and the child component (CountLabel) must both be rendered
	const button = container.getElementsByTagName("button")[0];
	expect(button).not.toBeNull();
	const label = container.getElementsByClassName("count-label")[0];
	expect(label).not.toBeNull();
	expect(label.textContent).toContain("Count: 5");

	// Clicking the button must update the child component's rendered text
	button.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(label.textContent).toContain("Count: 6");
});
