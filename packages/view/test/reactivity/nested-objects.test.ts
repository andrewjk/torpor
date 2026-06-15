import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";

test("context propagates through nested $watch objects", () => {
	let $state = $watch({
		user: {
			name: "Alice",
			address: {
				city: "NYC",
				zip: "10001",
			},
		},
	});

	expect($state.user.name).toBe("Alice");
	expect($state.user.address.city).toBe("NYC");

	$state.user.address.city = "LA";
	expect($state.user.address.city).toBe("LA");
});

test("nested reactive objects maintain reactivity at all levels", () => {
	let $state = $watch({
		level1: {
			level2: {
				level3: {
					value: "deep",
				},
			},
		},
	});

	let observed: string[] = [];
	let $derived = $watch({
		get computed() {
			return $state.level1.level2.level3.value;
		},
	});

	// Just verify we can read nested values
	expect($derived.computed).toBe("deep");

	$state.level1.level2.level3.value = "deeper";
	expect($derived.computed).toBe("deeper");
});

test("array of objects maintains reactivity", () => {
	let $state = $watch({
		items: [{ name: "a" }, { name: "b" }],
	});

	expect($state.items[0].name).toBe("a");

	$state.items[0].name = "x";
	expect($state.items[0].name).toBe("x");
});

test("adding new property to reactive object", () => {
	let $state = $watch<{ dynamic: Record<string, number> }>({
		dynamic: {},
	});

	$state.dynamic.newKey = 42;
	expect($state.dynamic.newKey).toBe(42);
});

test("deleting property from reactive object", () => {
	let $state = $watch<{ data: Record<string, number> }>({
		data: { a: 1, b: 2 },
	});

	expect($state.data.a).toBe(1);
	delete $state.data.a;
	expect($state.data.a).toBeUndefined();
});

test("reactive object with array splice", () => {
	let $state = $watch({
		list: [1, 2, 3, 4, 5],
	});

	let removed = $state.list.splice(1, 2);
	expect(removed.length).toBe(2);
	expect(removed[0]).toBe(2);
	expect(removed[1]).toBe(3);
	expect($state.list.length).toBe(3);
	expect($state.list[0]).toBe(1);
	expect($state.list[1]).toBe(4);
	expect($state.list[2]).toBe(5);
});

test("reactive object with array sort", () => {
	let $state = $watch({
		numbers: [3, 1, 4, 1, 5, 9, 2, 6],
	});

	$state.numbers.sort();
	expect($state.numbers.length).toBe(8);
	expect($state.numbers[0]).toBe(1);
	expect($state.numbers[1]).toBe(1);
	expect($state.numbers[2]).toBe(2);
	expect($state.numbers[3]).toBe(3);
	expect($state.numbers[4]).toBe(4);
	expect($state.numbers[5]).toBe(5);
	expect($state.numbers[6]).toBe(6);
	expect($state.numbers[7]).toBe(9);
});

test("setting array index beyond length", () => {
	let $state = $watch({
		arr: [1, 2, 3],
	});

	$state.arr[5] = 99;
	expect($state.arr[5]).toBe(99);
	expect($state.arr.length).toBe(6);
});
