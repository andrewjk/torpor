import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $unwrap from "../../src/watch/$unwrap";
import $watch from "../../src/watch/$watch";

test("watched date methods return correct values", () => {
	let date = $watch(new Date(2024, 0, 15));
	expect(date.getFullYear()).toBe(2024);
	expect(date.getMonth()).toBe(0);
	expect(date.getDate()).toBe(15);
	expect(date.getTime()).toBe(new Date(2024, 0, 15).getTime());
	expect(date.toISOString()).toBe(new Date(2024, 0, 15).toISOString());
	expect(date.valueOf()).toBe(new Date(2024, 0, 15).getTime());
});

test("watched date is an instanceof Date and unwraps to a raw date", () => {
	let date = $watch(new Date(2024, 0, 15));
	expect(date).toBeInstanceOf(Date);

	let raw = $unwrap(date);
	expect(raw).toBeInstanceOf(Date);
	expect(raw).not.toBe(date);
	expect(raw.getFullYear()).toBe(2024);
});

test("watched date mutation re-runs effects", () => {
	let date = $watch(new Date(2024, 0, 15));
	let runs = 0;
	let year = 0;

	$run(() => {
		runs++;
		year = date.getFullYear();
	});

	expect(runs).toBe(1);
	expect(year).toBe(2024);

	date.setFullYear(2025);
	expect(runs).toBe(2);
	expect(year).toBe(2025);

	date.setMonth(5);
	expect(runs).toBe(3);
	expect(year).toBe(2025);
});

test("watched date via toPrimitive re-runs effects", () => {
	let date = $watch(new Date(2024, 0, 15));
	let runs = 0;
	let text = "";

	$run(() => {
		runs++;
		// Comparisons go through Symbol.toPrimitive
		text = date < new Date(2100, 0, 1) ? "past" : "future";
	});

	expect(runs).toBe(1);
	expect(text).toBe("past");

	date.setTime(new Date(2200, 0, 15).getTime());
	expect(runs).toBe(2);
	expect(text).toBe("future");

	// JSON.stringify also goes through the date's prototype methods
	expect(JSON.parse(JSON.stringify({ date }))).toEqual({
		date: new Date(2200, 0, 15).toISOString(),
	});
});

test("nested date in watched state is reactive", () => {
	let $state = $watch({ inner: { date: new Date(2024, 0, 15) } });
	let runs = 0;
	let year = 0;

	$run(() => {
		runs++;
		year = $state.inner.date.getFullYear();
	});

	expect(runs).toBe(1);
	expect(year).toBe(2024);

	$state.inner.date.setFullYear(2025);
	expect(runs).toBe(2);
	expect(year).toBe(2025);

	// Replacing the date entirely also re-runs
	$state.inner.date = new Date(2026, 0, 15);
	expect(runs).toBe(3);
	expect(year).toBe(2026);
});

test("top-level date in watched state is reactive", () => {
	let $state = $watch({ date: new Date(2024, 0, 15) });
	let runs = 0;
	let year = 0;

	$run(() => {
		runs++;
		year = $state.date.getFullYear();
	});

	expect(runs).toBe(1);
	expect(year).toBe(2024);

	$state.date.setFullYear(2025);
	expect(runs).toBe(2);
	expect(year).toBe(2025);
});

test("setting a plain date on watched state wraps it automatically", () => {
	let $state = $watch({});
	let runs = 0;
	let year = 0;

	$state.date = new Date(2024, 0, 15);

	$run(() => {
		runs++;
		year = $state.date.getFullYear();
	});

	expect(runs).toBe(1);
	expect(year).toBe(2024);

	// The stored date is reactive immediately, before any explicit read
	$state.date.setFullYear(2025);
	expect(runs).toBe(2);
	expect(year).toBe(2025);

	// Reads return the same proxy
	expect($state.date).toBe($state.date);
});

test("setting a plain object on watched state wraps it automatically", () => {
	let $state = $watch({});
	let runs = 0;
	let count = 0;

	$state.inner = { count: 1 };

	$run(() => {
		runs++;
		count = $state.inner.count;
	});

	expect(runs).toBe(1);

	$state.inner.count = 2;
	expect(runs).toBe(2);
	expect(count).toBe(2);
});

test("shallow watches don't wrap values on set", () => {
	let $state = $watch({ date: new Date(2024, 0, 15) }, { shallow: true });
	let raw = new Date(2024, 5, 1);

	$state.date = raw;

	// Stored unwrapped -- the value is the raw date itself
	expect($state.date).toBe(raw);
});

test("setting the same date reference doesn't re-run effects", () => {
	let $state = $watch({ date: new Date(2024, 0, 15) });
	let runs = 0;

	$run(() => {
		runs++;
		void $state.date.getTime();
	});

	expect(runs).toBe(1);

	// Setting the stored value back is a no-op (identity check)
	const stored = $state.date;
	$state.date = stored;
	expect(runs).toBe(1);

	$state.date = new Date(2025, 0, 15);
	expect(runs).toBe(2);
});
