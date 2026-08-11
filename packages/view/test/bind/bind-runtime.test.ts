import { expect, test } from "vite-plus/test";
import $bind from "../../src/watch/$bind";
import $watch from "../../src/watch/$watch";

test("$bind forwards props → state on parent write", () => {
	let $state = $watch({ name: "default" });
	let $props = $watch({ name: "parent" });

	$bind($state, $props, "name");

	$props.name = "updated";
	expect($state.name).toBe("updated");
});

test("$bind forward skips undefined so $watch defaults survive", () => {
	let $state = $watch({ name: "default" });
	let $props = $watch({ name: undefined });

	$bind($state, $props, "name");

	$props.name = undefined;
	expect($state.name).toBe("default");

	$props.name = "a value";
	expect($state.name).toBe("a value");
});

test("$bind backward syncs state → props on state mutation", () => {
	let $state = $watch({ name: "default" });
	let $props = $watch({ name: "parent" });

	$bind($state, $props, "name");

	$state.name = "changed by child";
	expect($props.name).toBe("changed by child");
});

test("$bind backward does not clobber the parent's initial value", () => {
	let $state = $watch({ name: "child default" });
	let $props = $watch({ name: "parent" });

	$bind($state, $props, "name");

	// The parent's value wins on mount; the backward sync's first run is a no-op.
	expect($props.name).toBe("parent");
	expect($state.name).toBe("parent");
});

test("$bind sync stabilizes without an infinite loop", () => {
	let $state = $watch({ value: 1 });
	let $props = $watch({ value: 2 });

	$bind($state, $props, "value");

	$state.value = 10;
	expect($props.value).toBe(10);
	expect($state.value).toBe(10);

	$props.value = 20;
	expect($state.value).toBe(20);
	expect($props.value).toBe(20);
});

test("$bind syncs multiple keys", () => {
	let $state = $watch({ name: "default", age: 0 });
	let $props = $watch({ name: "parent", age: 30 });

	$bind($state, $props, "name", "age");

	$props.name = "new name";
	$props.age = 40;
	expect($state.name).toBe("new name");
	expect($state.age).toBe(40);

	$state.age = 50;
	expect($props.age).toBe(50);
});

test("$bind accepts an array of keys", () => {
	let $state = $watch({ a: 1, b: 2 });
	let $props = $watch({ a: 10, b: 20 });

	$bind($state, $props, ["a", "b"]);

	$props.a = 100;
	expect($state.a).toBe(100);
	$state.b = 200;
	expect($props.b).toBe(200);
});

test("$bind does nothing when props is undefined", () => {
	let $state = $watch({ name: "default" });

	$bind($state, undefined, "name");

	$state.name = "changed";
	expect($state.name).toBe("changed");
});

test("$bind reactions are scoped to their subscribed keys", () => {
	let $state = $watch({ name: "default", other: 1 });
	let $props = $watch({ name: "parent", other: 1 });

	$bind($state, $props, "name");

	// Unrelated props writes do not touch state
	$props.other = 99;
	expect($state.other).toBe(1);
	// ...and unrelated state writes do not touch props
	$state.other = 5;
	expect($props.other).toBe(99);
});
