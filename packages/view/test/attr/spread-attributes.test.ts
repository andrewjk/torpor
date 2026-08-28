import { expect, test } from "vite-plus/test";
import spreadAttributes from "../../src/render/spreadAttributes";

function makeEl(): HTMLElement {
	return document.createElement("div");
}

test("spreadAttributes applies entries", () => {
	let el = makeEl();
	spreadAttributes(el, { "data-one": "1", title: "hello", disabled: true });
	expect(el.getAttribute("data-one")).toBe("1");
	expect(el.getAttribute("title")).toBe("hello");
	expect(el.getAttribute("disabled")).toBe("true");
});

test("spreadAttributes with false/null/undefined removes attributes", () => {
	let el = makeEl();
	el.setAttribute("data-one", "1");
	spreadAttributes(el, { "data-one": false, "data-two": null, "data-three": undefined });
	expect(el.hasAttribute("data-one")).toBe(false);
	expect(el.hasAttribute("data-two")).toBe(false);
	expect(el.hasAttribute("data-three")).toBe(false);
});

test("spreadAttributes removes entries dropped from the object", () => {
	let el = makeEl();
	spreadAttributes(el, { "data-one": "1", "data-two": "2" });
	spreadAttributes(el, { "data-two": "2" });
	expect(el.hasAttribute("data-one")).toBe(false);
	expect(el.getAttribute("data-two")).toBe("2");
});

test("spreadAttributes with null removes all previous entries", () => {
	let el = makeEl();
	spreadAttributes(el, { "data-one": "1" });
	spreadAttributes(el, null);
	expect(el.hasAttribute("data-one")).toBe(false);
});

test("spreadAttributes adds, replaces and removes delegated listeners", () => {
	// Delegation dispatches from `document`, so the element must be in the
	// document tree for the event to bubble up to it
	let el = makeEl();
	document.body.appendChild(el);
	let count = 0;
	spreadAttributes(el, { onclick: () => (count += 1) });
	el.click();
	expect(count).toBe(1);

	// Replacing the handler: the old one must stop firing
	let firstRan = false;
	spreadAttributes(el, {
		onclick: () => {
			firstRan = true;
		},
	});
	el.click();
	expect(firstRan).toBe(true);
	expect(count).toBe(1);

	// Dropping the key: no handler fires, and removal doesn't crash
	spreadAttributes(el, { "data-x": "1" });
	el.click();
	expect(firstRan).toBe(true);
	expect(count).toBe(1);

	el.remove();
});

test("spreadAttributes adds, replaces and removes direct listeners", () => {
	let el = makeEl();
	let count = 0;
	spreadAttributes(el, { onfocus: () => (count += 1) });
	el.dispatchEvent(new Event("focus"));
	expect(count).toBe(1);

	// Replacing a direct listener must detach the old one (this crashes
	// with removeEventListener(null) if the state tracking is wrong)
	let secondRan = false;
	spreadAttributes(el, {
		onfocus: () => {
			secondRan = true;
		},
	});
	el.dispatchEvent(new Event("focus"));
	expect(count).toBe(1);
	expect(secondRan).toBe(true);

	// Setting the listener to null detaches it without crashing
	spreadAttributes(el, { onfocus: null });
	el.dispatchEvent(new Event("focus"));
	expect(secondRan).toBe(true);

	// Dropping the key entirely
	spreadAttributes(el, { "data-x": "1" });
	el.dispatchEvent(new Event("focus"));
	expect(secondRan).toBe(true);
});

test("spreadAttributes tracks multiple spreads on one element separately", () => {
	let el = makeEl();
	spreadAttributes(el, { "data-one": "1" }, 0);
	spreadAttributes(el, { "data-two": "2" }, 1);

	// Removing an entry from the first spread must not remove the second
	// spread's attribute
	spreadAttributes(el, {}, 0);
	expect(el.hasAttribute("data-one")).toBe(false);
	expect(el.hasAttribute("data-two")).toBe(true);
});
