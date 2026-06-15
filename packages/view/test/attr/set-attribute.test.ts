import { expect, test } from "vitest";
import setAttribute from "../../src/render/setAttribute";

function makeEl(): HTMLElement {
	return document.createElement("div");
}

test("setAttribute sets string value", () => {
	let el = makeEl();
	setAttribute(el, "data-test", "hello");
	expect(el.getAttribute("data-test")).toBe("hello");
});

test("setAttribute with false removes attribute", () => {
	let el = makeEl();
	el.setAttribute("data-test", "value");
	setAttribute(el, "data-test", false);
	expect(el.hasAttribute("data-test")).toBe(false);
});

test("setAttribute with null removes attribute", () => {
	let el = makeEl();
	el.setAttribute("data-test", "value");
	setAttribute(el, "data-test", null);
	expect(el.hasAttribute("data-test")).toBe(false);
});

test("setAttribute with undefined removes attribute", () => {
	let el = makeEl();
	el.setAttribute("data-test", "value");
	setAttribute(el, "data-test", undefined);
	expect(el.hasAttribute("data-test")).toBe(false);
});

test("setAttribute with true sets 'true' string", () => {
	let el = makeEl();
	setAttribute(el, "data-test", true);
	expect(el.getAttribute("data-test")).toBe("true");
});

test("setAttribute with number sets string representation", () => {
	let el = makeEl();
	setAttribute(el, "data-count", 42);
	expect(el.getAttribute("data-count")).toBe("42");
});

test("setAttribute with 0 sets '0' string", () => {
	let el = makeEl();
	setAttribute(el, "data-count", 0);
	expect(el.getAttribute("data-count")).toBe("0");
});

test("setAttribute with empty string sets empty attribute", () => {
	let el = makeEl();
	setAttribute(el, "data-test", "");
	expect(el.getAttribute("data-test")).toBe("");
	expect(el.hasAttribute("data-test")).toBe(true);
});

test("setAttribute with negative number", () => {
	let el = makeEl();
	setAttribute(el, "data-neg", -5);
	expect(el.getAttribute("data-neg")).toBe("-5");
});

test("setAttribute with float number", () => {
	let el = makeEl();
	setAttribute(el, "data-float", 3.14);
	expect(el.getAttribute("data-float")).toBe("3.14");
});

test("setAttribute overwrites existing value", () => {
	let el = makeEl();
	setAttribute(el, "data-test", "first");
	setAttribute(el, "data-test", "second");
	expect(el.getAttribute("data-test")).toBe("second");
});

test("setAttribute transitions from value to false", () => {
	let el = makeEl();
	setAttribute(el, "disabled", "disabled");
	setAttribute(el, "disabled", false);
	expect(el.hasAttribute("disabled")).toBe(false);
});

test("setAttribute transitions from false to value", () => {
	let el = makeEl();
	setAttribute(el, "disabled", false);
	setAttribute(el, "disabled", "disabled");
	expect(el.getAttribute("disabled")).toBe("disabled");
});
