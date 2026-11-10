import { expect, test } from "vite-plus/test";
import { compileRestricted, renderRestricted } from "../src/restricted";
import hydrateEmbed from "../src/loader/hydrateEmbed";
import mountEmbed from "../src/loader/mountEmbed";
import EmbedVersionError from "../src/types/EmbedVersionError";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const SOURCE = `
export default function Counter($props: { start?: number }) {
	let count = $watch({ value: $props.start ?? 0 });
	function increment() {
		count.value++;
	}
	@render {
		<button onclick={increment}>Count: {count.value}</button>
	}
	@style {
		button {
			color: red;
		}
	}
}
`;

function artifact(): EmbedArtifact {
	return compileRestricted("counter-test", SOURCE);
}

function getButton(): HTMLButtonElement {
	const button = document.querySelector("button");
	if (!button) throw new Error("button not rendered");
	return button as HTMLButtonElement;
}

test("mounts an artifact and renders reactively", async () => {
	const target = document.createElement("div");
	document.body.appendChild(target);

	const handle = mountEmbed(target, artifact(), { start: 5 });
	const button = getButton();

	expect(button.textContent).toBe("Count: 5");
	button.click();
	button.click();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(button.textContent).toBe("Count: 7");

	handle.unmount();
	expect(target.innerHTML).toBe("");
});

test("injects styles on mount and removes them on unmount", () => {
	const art = artifact();
	expect(document.querySelector('style[data-torpor-embed="counter-test"]')).toBeNull();

	const targetA = document.createElement("div");
	document.body.appendChild(targetA);
	const handle = mountEmbed(targetA, art);
	const style = document.querySelector('style[data-torpor-embed="counter-test"]');
	expect(style).not.toBeNull();
	expect(style?.textContent).toContain("color: red");

	// Mounting the same artifact into another target doesn't duplicate styles
	const targetB = document.createElement("div");
	document.body.appendChild(targetB);
	const handleB = mountEmbed(targetB, art);
	expect(document.querySelectorAll('style[data-torpor-embed="counter-test"]').length).toBe(1);

	handle.unmount();
	handleB.unmount();
	expect(document.querySelector('style[data-torpor-embed="counter-test"]')).toBeNull();
});

test("throws EmbedVersionError on a version mismatch", () => {
	const target = document.createElement("div");
	document.body.appendChild(target);

	const art = artifact();
	expect(() => mountEmbed(target, art, undefined, { runtimeVersion: "0.0.0-nope" })).toThrow(
		EmbedVersionError,
	);

	// With allowMismatch, it warns and runs anyway
	const warn = console.warn;
	let warned = "";
	console.warn = (message: string) => (warned = message);
	try {
		const handle = mountEmbed(target, art, undefined, {
			runtimeVersion: "0.0.0-nope",
			allowVersionMismatch: true,
		});
		expect(warned).toContain("Version mismatch");
		expect(getButton().textContent).toBe("Count: 0");
		handle.unmount();
	} finally {
		console.warn = warn;
	}
});

test("hydrates server-rendered markup", async () => {
	const art = artifact();

	// Render the restricted server build to HTML, the way a host app would
	const { body } = await renderRestricted(art, { props: { start: 3 } });

	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);

	// No interactivity before hydration
	expect(target.querySelector("button")?.textContent).toBe("Count: 3");

	const handle = hydrateEmbed(target, art, { start: 3 });
	const button = getButton();

	button.click();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(button.textContent).toBe("Count: 4");

	handle.unmount();
	expect(target.innerHTML).toBe("");
});

test("injectStyles honors the nonce option", () => {
	const target = document.createElement("div");
	document.body.appendChild(target);

	const handle = mountEmbed(target, artifact(), {}, { nonce: "style-nonce-1" });
	const style = document.querySelector('style[data-torpor-embed="counter-test"]');
	expect(style?.getAttribute("nonce")).toBe("style-nonce-1");
	handle.unmount();
});
