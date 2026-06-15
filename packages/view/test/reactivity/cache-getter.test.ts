import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $cache from "../../src/watch/$cache";
import $watch from "../../src/watch/$watch";

test("$cache computed getters return correct values", () => {
	let $state = $watch({
		value: 3,
		get squared() {
			return $cache(() => $state.value * $state.value);
		},
		get cubed() {
			return $cache(() => $state.squared * $state.value);
		},
	});

	expect($state.squared).toBe(9);
	expect($state.cubed).toBe(27);
});

test("$cache updates when dependencies change", () => {
	let $state = $watch({
		value: 3,
		get squared() {
			return $cache(() => $state.value * $state.value);
		},
	});

	expect($state.squared).toBe(9);

	$state.value = 4;
	expect($state.squared).toBe(16);

	$state.value = 5;
	expect($state.squared).toBe(25);
});

test("$cache is lazily computed", () => {
	let computeCount = 0;
	let $state = $watch({
		a: 1,
		get cached() {
			return $cache(() => {
				computeCount++;
				return $state.a * 2;
			});
		},
	});

	expect(computeCount).toBe(0);
	expect($state.cached).toBe(2);
	expect(computeCount).toBe(1);
	expect($state.cached).toBe(2);
	expect(computeCount).toBe(1);
});

test("$cache recomputes when dependency changes", () => {
	let computeCount = 0;
	let $state = $watch({
		a: 1,
		get cached() {
			return $cache(() => {
				computeCount++;
				return $state.a * 2;
			});
		},
	});

	expect($state.cached).toBe(2);
	expect(computeCount).toBe(1);

	$state.a = 5;
	expect($state.cached).toBe(10);
	expect(computeCount).toBe(2);
});

test("$cache chain of dependent caches", () => {
	let $state = $watch({
		base: 2,
		get doubled() {
			return $cache(() => $state.base * 2);
		},
		get quadrupled() {
			return $cache(() => $state.doubled * 2);
		},
		get octupled() {
			return $cache(() => $state.quadrupled * 2);
		},
	});

	expect($state.doubled).toBe(4);
	expect($state.quadrupled).toBe(8);
	expect($state.octupled).toBe(16);

	$state.base = 3;
	expect($state.doubled).toBe(6);
	expect($state.quadrupled).toBe(12);
	expect($state.octupled).toBe(24);
});
