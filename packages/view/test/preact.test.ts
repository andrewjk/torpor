import { afterEach, describe, expect, it, vi } from "vitest";
import $batch from "../src/render/$batch";
import $cache from "../src/render/$cache";
import $peek from "../src/render/$peek";
import $run from "../src/render/$run";
import $watch from "../src/render/$watch";
import context from "../src/render/context";

//import checkState from "./checkState";
//import printDiagram from "./printDiagram";
//import printSimpleDiagram from "./printSimpleDiagram";

/*
let si = 1;
dev.subName = () => `S${si++}`;
dev.effectName = (fn: Function) => {
	let name = String(fn);
	if (name.startsWith("function ")) {
		name = name.substring(9);
	}
	name = name.substring(0, name.indexOf("() {"));
	return name;
};
dev.propName = (key: PropertyKey) => String(key);
*/
afterEach(() => {
	//expect(context.activeTarget).toBe(null);
	expect(context.batch, "POST TEST BATCH").toBe(0);
});

describe("signal", () => {
	it("should return value", () => {
		const v = [1, 2];
		let $state = $watch({ s: v });
		expect($state.s).toEqual(v);
	});

	//	it("should inherit from Signal", () => {
	//		expect(signal(0)).to.be.instanceOf(Signal);
	//	});
	//
	//	it("should support .toString()", () => {
	//		let $state = $watch({ s: 123 });
	//		expect(s.toString()).equal("123");
	//	});
	//
	//	it("should support .toJSON()", () => {
	//		let $state = $watch({ s: 123 });
	//		expect(s.toJSON()).equal(123);
	//	});
	//
	//	it("should support JSON.Stringify()", () => {
	//		let $state = $watch({ s: 123 });
	//		expect(JSON.stringify({ s })).equal(JSON.stringify({ s: 123 }));
	//	});
	//
	//	it("should support .valueOf()", () => {
	//		let $state = $watch({ s: 123 });
	//		expect(s).to.have.property("valueOf");
	//		expect(s.valueOf).to.be.a("function");
	//		expect(s.valueOf()).equal(123);
	//		expect(+s).equal(123);
	//
	//		let $state = $watch({ a: 1 });
	//		let $state = $watch({ b: 2 });
	//		// @ts-ignore-next-line
	//		expect(a + b).toEqual(3);
	//	});
	//
	//	it("should notify other listeners of changes after one listener is disposed", () => {
	//		let $state = $watch({ s: 0 });
	//		let spy1 = vi.fn(() => {
	//			$state.s;
	//		});
	//		let spy2 = vi.fn(() => {
	//			$state.s;
	//		});
	//		let spy3 = vi.fn(() => {
	//			$state.s;
	//		});
	//
	//		$run(spy1);
	//		const dispose = $run(spy2);
	//		$run(spy3);
	//
	//		expect(spy1).toHaveBeenCalledOnce();
	//		expect(spy2).toHaveBeenCalledOnce();
	//		expect(spy3).toHaveBeenCalledOnce();
	//
	//		dispose();
	//
	//		$state.s = 1;
	//		expect(spy1).toHaveBeenCalledTimes(2);
	//		expect(spy2).toHaveBeenCalledOnce();
	//		expect(spy3).toHaveBeenCalledTimes(2);
	//	});

	describe("$peek()", () => {
		it("should get value", () => {
			let $state = $watch({ s: 1 });
			expect($peek(() => $state.s)).toEqual(1);
		});

		it("should get the updated value after a value change", () => {
			let $state = $watch({ s: 1 });
			$state.s = 2;
			expect($peek(() => $state.s)).toEqual(2);
		});

		it("should not make surrounding effect depend on the signal", () => {
			let $state = $watch({ s: 1 });
			let spy = vi.fn(() => {
				$peek(() => $state.s);
			});

			$run(spy);
			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledOnce();

			$state.s = 2;
			expect(spy).toHaveBeenCalledOnce();
		});

		it("should not make surrounding computed depend on the signal", () => {
			let spy = vi.fn(() => {
				$peek(() => $state.s);
			});
			let $state = $watch({
				s: 1,
				get d() {
					return $cache(spy);
				},
			});

			$state.d;
			expect(spy).toHaveBeenCalledOnce();

			$state.s = 2;
			$state.d;
			expect(spy).toHaveBeenCalledOnce();
		});
	});

	describe("subscribe", () => {
		it("should subscribe to a signal", () => {
			let spy = vi.fn();
			let $state = $watch({ a: 1 });

			$run(() => {
				spy($state.a);
			});

			expect(spy).toBeCalledWith(1);
		});

		it("should run the callback when the signal value changes", () => {
			let spy = vi.fn();
			let $state = $watch({ a: 1 });

			$run(() => {
				spy($state.a);
			});

			$state.a = 2;
			expect(spy).toBeCalledWith(2);
		});

		//		it("should unsubscribe from a signal", () => {
		//			let spy = vi.fn();
		//			let $state = $watch({ a: 1 });
		//
		//			const dispose = a.subscribe(spy);
		//			dispose();
		//			spy.mockReset();
		//
		//			$state.a = 2;
		//			expect(spy).not.toHaveBeenCalled();
		//		});

		//		it("should not start triggering on when a signal accessed in the callback changes", () => {
		//			let spy = vi.fn();
		//			let $state = $watch({ a: 0 });
		//			let $state = $watch({ b: 0 });
		//
		//			a.subscribe(() => {
		//				$state.b;
		//				spy();
		//			});
		//			expect(spy).toHaveBeenCalledOnce();
		//			spy.mockReset();
		//
		//			$state.b++;
		//			expect(spy).not.toHaveBeenCalled();
		//		});

		it("should not cause surrounding effect to subscribe to changes to a signal accessed in the callback", () => {
			let spy = vi.fn();
			let $state = $watch({ a: 0, b: 0 });

			$run(() => {
				$state.a;
				$run(() => {
					$state.b;
				});
				spy();
			});
			expect(spy).toHaveBeenCalledOnce();
			spy.mockReset();

			$state.b++;
			expect(spy).not.toHaveBeenCalled();
		});
	});

	//	describe(".(un)watched()", () => {
	//		it("should call watched when first subscription occurs", () => {
	//			const watched = vi.fn();
	//			const unwatched = vi.fn();
	//			let $state = $watch({ s: 1, { watched, unwatched } });
	//			expect(watched).not.toHaveBeenCalled();
	//			const unsubscribe = s.subscribe(() => {});
	//			expect(watched).toHaveBeenCalledOnce();
	//			const unsubscribe2 = s.subscribe(() => {});
	//			expect(watched).toHaveBeenCalledOnce();
	//			unsubscribe();
	//			unsubscribe2();
	//			expect(unwatched).toHaveBeenCalledOnce();
	//		});
	//
	//		it("should allow updating the signal from watched", async () => {
	//			const calls: number[] = [];
	//			const watched = vi.fn(() => {
	//				setTimeout(() => {
	//					$state.s = 2;
	//				});
	//			});
	//			const unwatched = vi.fn();
	//			let $state = $watch({ s: 1, { watched, unwatched } });
	//			expect(watched).not.toHaveBeenCalled();
	//			const unsubscribe = s.subscribe(() => {
	//				calls.push(s.value);
	//			});
	//			expect(watched).toHaveBeenCalledOnce();
	//			const unsubscribe2 = s.subscribe(() => {});
	//			expect(watched).toHaveBeenCalledOnce();
	//			await new Promise((resolve) => setTimeout(resolve));
	//			unsubscribe();
	//			unsubscribe2();
	//			expect(unwatched).toHaveBeenCalledOnce();
	//			expect(calls).to.deep.equal([1, 2]);
	//		});
	//	});

	//	it("signals should be identified with a symbol", () => {
	//		let $state = $watch({ a: 0 });
	//		expect(a.brand).toEqual(Symbol.for("preact-signals"));
	//	});
	//
	//	it("should be identified with a symbol", () => {
	//		const a = $derive(() => {});
	//		expect(a.brand).toEqual(Symbol.for("preact-signals"));
	//	});
});

describe("$run()", () => {
	it("should run the callback immediately", () => {
		let $state = $watch({ s: 123 });
		let spy = vi.fn(() => {
			$state.s;
		});
		$run(spy);
		expect(spy).toHaveBeenCalled();
	});

	it("should subscribe to signals", () => {
		let $state = $watch({ s: 123 });
		let spy = vi.fn(() => {
			$state.s;
		});
		$run(spy);
		spy.mockReset();
		$state.s = 42;
		expect(spy).toHaveBeenCalled();
	});

	it("should subscribe to multiple signals", () => {
		let $state = $watch({ a: "a", b: "b" });
		let spy = vi.fn(() => {
			$state.a;
			$state.b;
		});
		$run(spy);
		spy.mockReset();

		$state.a = "aa";
		$state.b = "bb";
		expect(spy).toHaveBeenCalledTimes(2);
	});

	//	it("should dispose of subscriptions", () => {
	//		let $state = $watch({ a: "a" });
	//		let $state = $watch({ b: "b" });
	//		let spy = vi.fn(() => {
	//			$state.a + " " + $state.b;
	//		});
	//		const dispose = $run(spy);
	//		spy.mockReset();
	//
	//		dispose();
	//		expect(spy).not.toHaveBeenCalled();
	//
	//		$state.a = "aa";
	//		$state.b = "bb";
	//		expect(spy).not.toHaveBeenCalled();
	//	});
	//
	//	it("should dispose of subscriptions", () => {
	//		let $state = $watch({ a: "a" });
	//		let $state = $watch({ b: "b" });
	//		let spy = vi.fn(() => {
	//			$state.a + " " + $state.b;
	//		});
	//		$run(function () {
	//			spy();
	//			if ($state.a === "aa") {
	//				this.dispose();
	//			}
	//		});
	//
	//		expect(spy).toHaveBeenCalled();
	//
	//		$state.a = "aa";
	//		expect(spy).toHaveBeenCalledTimes(2);
	//
	//		$state.a = "aaa";
	//		expect(spy).toHaveBeenCalledTimes(2);
	//	});
	//
	//	it("should dispose of subscriptions immediately", () => {
	//		let $state = $watch({ a: "a" });
	//		let $state = $watch({ b: "b" });
	//		let spy = vi.fn(() => {
	//			$state.a + " " + $state.b;
	//		});
	//		$run(function () {
	//			spy();
	//			this.dispose();
	//		});
	//
	//		expect(spy).toHaveBeenCalledOnce();
	//
	//		$state.a = "aa";
	//		expect(spy).toHaveBeenCalledOnce();
	//
	//		$state.a = "aaa";
	//		expect(spy).toHaveBeenCalledOnce();
	//	});
	//
	//	it("should dispose of subscriptions when called twice", () => {
	//		let $state = $watch({ a: "a" });
	//		let $state = $watch({ b: "b" });
	//		let spy = vi.fn(() => {
	//			$state.a + " " + $state.b;
	//		});
	//		const dispose = $run(function () {
	//			spy();
	//			if ($state.a === "aa") {
	//				this.dispose();
	//			}
	//		});
	//
	//		expect(spy).toHaveBeenCalled();
	//
	//		$state.a = "aa";
	//		expect(spy).toHaveBeenCalledTimes(2);
	//		dispose();
	//
	//		$state.a = "aaa";
	//		expect(spy).toHaveBeenCalledTimes(2);
	//	});
	//
	//	it("should dispose of subscriptions immediately and signals are read after disposing", () => {
	//		let $state = $watch({ a: "a" });
	//		let $state = $watch({ b: "b" });
	//		let spy = vi.fn(() => {
	//			$state.a + " " + $state.b;
	//		});
	//		$run(function () {
	//			this.dispose();
	//			spy();
	//		});
	//
	//		expect(spy).toHaveBeenCalledOnce();
	//
	//		$state.a = "aa";
	//		expect(spy).toHaveBeenCalledOnce();
	//
	//		$state.a = "aaa";
	//		expect(spy).toHaveBeenCalledOnce();
	//	});
	//
	//	it("should dispose of subscriptions immediately when called twice (deferred)", () => {
	//		let $state = $watch({ a: "a" });
	//		let $state = $watch({ b: "b" });
	//		let spy = vi.fn(() => {
	//			$state.a + " " + $state.b;
	//		});
	//		const dispose = $run(function () {
	//			spy();
	//			this.dispose();
	//		});
	//
	//		expect(spy).toHaveBeenCalledOnce();
	//
	//		$state.a = "aa";
	//		expect(spy).toHaveBeenCalledOnce();
	//		dispose();
	//
	//		$state.a = "aaa";
	//		expect(spy).toHaveBeenCalledOnce();
	//	});
	//
	//	it("should unsubscribe from signal", () => {
	//		let $state = $watch({ s: 123 });
	//		let spy = vi.fn(() => {
	//			$state.s;
	//		});
	//		const unsub = $run(spy);
	//		spy.mockReset();
	//
	//		unsub();
	//		$state.s = 42;
	//		expect(spy).not.toHaveBeenCalled();
	//	});

	it("should conditionally unsubscribe from signals", () => {
		let $state = $watch({ a: "a", b: "b", cond: true });

		let spy = vi.fn(() => {
			$state.cond ? $state.a : $state.b;
		});

		$run(spy);
		expect(spy).toHaveBeenCalledOnce();

		$state.b = "bb";
		expect(spy).toHaveBeenCalledOnce();

		$state.cond = false;
		expect(spy).toHaveBeenCalledTimes(2);

		spy.mockReset();

		$state.a = "aaa";
		expect(spy).not.toHaveBeenCalled();
	});

	it("should batch writes", () => {
		let $state = $watch({ a: "a" });
		let spy = vi.fn(() => {
			$state.a;
		});
		$run(spy);
		spy.mockReset();

		$run(() => {
			$state.a = "aa";
			$state.a = "aaa";
		});

		expect(spy).toHaveBeenCalledOnce();
	});

	it("should call the cleanup callback before the next run", () => {
		let $state = $watch({ a: 0 });
		let spy = vi.fn();

		$run(() => {
			$state.a;
			return spy;
		});
		expect(spy).not.toHaveBeenCalled();
		$state.a = 1;
		expect(spy).toHaveBeenCalledOnce();
		$state.a = 2;
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("should call only the callback from the previous run", () => {
		let spy1 = vi.fn();
		let spy2 = vi.fn();
		let spy3 = vi.fn();
		let $state = $watch({ a: spy1 });

		$run(() => {
			return $state.a;
		});

		expect(spy1).not.toHaveBeenCalled();
		expect(spy2).not.toHaveBeenCalled();
		expect(spy3).not.toHaveBeenCalled();

		$state.a = spy2;
		expect(spy1).toHaveBeenCalledOnce();
		expect(spy2).not.toHaveBeenCalled();
		expect(spy3).not.toHaveBeenCalled();

		$state.a = spy3;
		expect(spy1).toHaveBeenCalledOnce();
		expect(spy2).toHaveBeenCalledOnce();
		expect(spy3).not.toHaveBeenCalled();
	});

	//	it("should call the cleanup callback function when disposed", () => {
	//		let spy = vi.fn();
	//
	//		const dispose = $run(() => {
	//			return spy;
	//		});
	//		expect(spy).not.toHaveBeenCalled();
	//		dispose();
	//		expect(spy).toHaveBeenCalledOnce();
	//	});

	it("should not recompute if the effect has been notified about changes, but no direct dependency has actually changed", () => {
		let $state = $watch({
			s: 0,
			get c() {
				return $cache(() => {
					$state.s;
					return 0;
				});
			},
		});
		let spy = vi.fn(() => {
			$state.c;
		});
		$run(spy);
		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$state.s = 1;
		expect(spy).not.toHaveBeenCalled();
	});

	it("should not recompute dependencies unnecessarily", () => {
		let spy = vi.fn();
		let $state = $watch({
			a: 0,
			b: 0,
			get c() {
				return $cache(() => {
					spy();
					return $state.b;
				});
			},
		});
		$run(() => {
			if ($state.a === 0) {
				$state.c;
			}
		});
		expect(spy).toHaveBeenCalledOnce();

		$batch(() => {
			$state.b = 1;
			$state.a = 1;
		});
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should not recompute dependencies out of order", () => {
		let spy = vi.fn();
		let $state = $watch({
			a: 1,
			b: 1,
			c: 1,
			get d() {
				return $cache(() => {
					spy();
					return $state.c;
				});
			},
		});

		$run(() => {
			if ($state.a > 0) {
				$state.b;
				$state.d;
			} else {
				$state.b;
			}
		});
		spy.mockReset();

		$batch(() => {
			$state.a = 2;
			$state.b = 2;
			$state.c = 2;
		});
		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$batch(() => {
			$state.a = -1;
			$state.b = -1;
			$state.c = -1;
		});
		expect(spy).not.toHaveBeenCalled();
		spy.mockReset();
	});

	it("should recompute if a dependency changes during computation after becoming a dependency", () => {
		let $state = $watch({ a: 0 });
		let spy = vi.fn(() => {
			if ($state.a === 0) {
				$state.a++;
			}
		});
		$run(spy);
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("should run the cleanup in an implicit batch", () => {
		let $state = $watch({ a: 0, b: "a", c: "b" });
		let spy = vi.fn();

		$run(() => {
			$state.b;
			$state.c;
			spy($state.b + $state.c);
		});

		$run(() => {
			$state.a;
			return () => {
				$state.b = "x";
				$state.c = "y";
			};
		});

		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$state.a = 1;
		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toBeCalledWith("xy");
	});

	it("should not retrigger the effect if the cleanup modifies one of the dependencies", () => {
		let $state = $watch({ a: 0 });
		let spy = vi.fn();

		$run(() => {
			spy($state.a);
			return () => {
				$state.a = 2;
			};
		});
		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$state.a = 1;
		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toBeCalledWith(2);
	});

	//	it("should run the cleanup if the effect disposes itself", () => {
	//		let $state = $watch({ a: 0 });
	//		let spy = vi.fn();
	//
	//		const dispose = $run(() => {
	//			if ($state.a > 0) {
	//				dispose();
	//				return spy;
	//			}
	//		});
	//		expect(spy).not.toHaveBeenCalled();
	//		$state.a = 1;
	//		expect(spy).toHaveBeenCalledOnce();
	//		$state.a = 2;
	//		expect(spy).toHaveBeenCalledOnce();
	//	});
	//
	//	it("should not run the effect if the cleanup function disposes it", () => {
	//		let $state = $watch({ a: 0 });
	//		let spy = vi.fn();
	//
	//		const dispose = $run(() => {
	//			$state.a;
	//			spy();
	//			return () => {
	//				dispose();
	//			};
	//		});
	//		expect(spy).toHaveBeenCalledOnce();
	//		$state.a = 1;
	//		expect(spy).toHaveBeenCalledOnce();
	//	});

	it("should not subscribe to anything if first run throws", () => {
		let $state = $watch({ s: 0 });
		let spy = vi.fn(() => {
			$state.s;
			throw new Error("test");
		});
		expect(() => $run(spy)).toThrow("test");
		expect(spy).toHaveBeenCalledOnce();

		$state.s++;
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should reset the cleanup if the effect throws", () => {
		let $state = $watch({ a: 0 });
		let spy = vi.fn();

		$run(() => {
			if ($state.a === 0) {
				return spy;
			} else {
				throw new Error("hello");
			}
		});
		expect(spy).not.toHaveBeenCalled();
		expect(() => ($state.a = 1)).toThrow("hello");
		expect(spy).toHaveBeenCalledOnce();
		$state.a = 0;
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should dispose the effect if the cleanup callback throws", () => {
		let $state = $watch({ a: 0 });
		let spy = vi.fn();

		$run(() => {
			if ($state.a === 0) {
				return () => {
					throw new Error("hello");
				};
			} else {
				spy();
			}
		});
		expect(spy).not.toHaveBeenCalled();
		expect(() => $state.a++).toThrow("hello");
		expect(spy).not.toHaveBeenCalled();
		$state.a++;
		expect(spy).not.toHaveBeenCalled();
	});

	it("should run cleanups outside any evaluation context", () => {
		let spy = vi.fn();
		let $state = $watch({
			a: 0,
			b: 0,
			get c() {
				return $cache(() => {
					if ($state.a === 0) {
						$run(() => {
							return () => {
								$state.b;
							};
						});
					}
					return $state.a;
				});
			},
		});

		$run(() => {
			spy();
			$state.c;
		});
		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$state.a = 1;
		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$state.b = 1;
		expect(spy).not.toHaveBeenCalled();
	});

	// NOTE: I don't think we can cycle in effects, because we don't add already
	// running effects to the batch

	it.skip("should throw on cycles", () => {
		let $state = $watch({ a: 0 });
		let i = 0;

		const fn = () =>
			$run(() => {
				// Prevent test suite from spinning if limit is not hit
				if (i++ > 200) {
					throw new Error("test failed");
				}
				$state.a;
				$state.a = NaN;
			});

		expect(fn).toThrow("Cycle detected");
	});

	it.skip("should throw on indirect cycles", () => {
		let $state = $watch({
			a: 0,
			get c() {
				return $cache(() => {
					$state.a;
					$state.a = NaN;
					return NaN;
				});
			},
		});

		let i = 0;
		const fn = () =>
			$run(() => {
				// Prevent test suite from spinning if limit is not hit
				if (i++ > 200) {
					throw new Error("test failed");
				}
				$state.c;
			});

		expect(fn).toThrow("Cycle detected");
	});

	//	it("should allow disposing the effect multiple times", () => {
	//		const dispose = $run(() => undefined);
	//		dispose();
	//		expect(() => dispose()).not.toThrow();
	//	});
	//
	//	it("should support resource management disposal", () => {
	//		//let $state = $watch({ a: 0 });
	//		//let spy = vi.fn();
	//		//{
	//		//	// @ts-expect-error This is a test for the dispose API
	//		//	using _dispose = $run(() => {
	//		//		$state.a;
	//		//		return spy;
	//		//	});
	//		//}
	//		//expect(spy).toHaveBeenCalledOnce();
	//	});
	//
	//	it("should allow disposing a running effect", () => {
	//		let $state = $watch({ a: 0 });
	//		let spy = vi.fn();
	//		const dispose = $run(() => {
	//			if ($state.a === 1) {
	//				dispose();
	//				spy();
	//			}
	//		});
	//		expect(spy).not.toHaveBeenCalled();
	//		$state.a = 1;
	//		expect(spy).toHaveBeenCalledOnce();
	//		$state.a = 2;
	//		expect(spy).toHaveBeenCalledOnce();
	//	});
	//
	//	it("should not run if it's first been triggered and then disposed in a batch", () => {
	//		let $state = $watch({ a: 0 });
	//		let spy = vi.fn(() => {
	//			$state.a;
	//		});
	//		const dispose = $run(spy);
	//		spy.mockReset();
	//
	//		$batch(() => {
	//			$state.a = 1;
	//			dispose();
	//		});
	//
	//		expect(spy).not.toHaveBeenCalled();
	//	});
	//
	//	it("should not run if it's been triggered, disposed and then triggered again in a batch", () => {
	//		let $state = $watch({ a: 0 });
	//		let spy = vi.fn(() => {
	//			$state.a;
	//		});
	//		const dispose = $run(spy);
	//		spy.mockReset();
	//
	//		$batch(() => {
	//			$state.a = 1;
	//			dispose();
	//			$state.a = 2;
	//		});
	//
	//		expect(spy).not.toHaveBeenCalled();
	//	});

	it("should not rerun parent effect if a nested child effect's signal's value changes", () => {
		let $state = $watch({
			parentSignal: 0,
			childSignal: 0,
			independentSignal: 0,
		});

		const parent$run = vi.fn(() => {
			$state.parentSignal;
		});
		const child$run = vi.fn(() => {
			$state.childSignal;
			//return () => console.log("CLEANUP CHILD");
		});
		const independent$run = vi.fn(() => {
			$state.independentSignal;
			//return () => console.log("CLEANUP INDEPENDENT");
		});

		$run(
			() => {
				parent$run();
				$run(child$run /*, { name: "CHILD $run" }*/);
				$run(independent$run /*, { name: "INDEPENDENT $run" }*/);
				//return () => console.log("CLEANUP PARENT");
			} /*,
			{ name: "PARENT $run" },*/,
		);

		expect(parent$run).toHaveBeenCalledOnce();
		expect(child$run).toHaveBeenCalledOnce();
		expect(independent$run).toHaveBeenCalledOnce();

		//console.log("===\nSETTING CHILD SIGNAL");
		$state.childSignal = 1;

		expect(parent$run).toHaveBeenCalledOnce();
		expect(child$run).toHaveBeenCalledTimes(2);
		expect(independent$run).toHaveBeenCalledOnce();

		//console.log("===\nSETTING PARENT SIGNAL");
		$state.parentSignal = 1;

		expect(parent$run).toHaveBeenCalledTimes(2);
		expect(child$run).toHaveBeenCalledTimes(3);
		expect(independent$run).toHaveBeenCalledTimes(2);
	});

	//	// Test internal behavior depended on by Preact & React integrations
	//	describe("internals", () => {
	//		it("should pass in the effect instance in callback's `this`", () => {
	//			let e: any;
	//			$run(function (this: any) {
	//				e = this;
	//			});
	//			expect(typeof e._start).toEqual("function");
	//			expect(typeof e._dispose).toEqual("function");
	//		});
	//
	//		it("should allow setting _callback that replaces the default functionality", () => {
	//			let $state = $watch({ a: 0 });
	//			const oldSpy = vi.fn();
	//			const newSpy = vi.fn();
	//
	//			let e: any;
	//			$run(function (this: any) {
	//				e = this;
	//				$state.a;
	//				oldSpy();
	//			});
	//			oldSpy.mockReset();
	//
	//			e._callback = newSpy;
	//			$state.a = 1;
	//
	//			expect(oldSpy).not.toHaveBeenCalled();
	//			expect(newSpy).toHaveBeenCalled();
	//		});
	//
	//		it("should return a function for closing the effect scope from _start", () => {
	//			let $state = $watch({ s: 0 });
	//
	//			let e: any;
	//			$run(function (this: any) {
	//				e = this;
	//			});
	//
	//			let spy = vi.fn();
	//			e._callback = spy;
	//
	//			const done1 = e._start();
	//			$state.s;
	//			done1();
	//			expect(spy).not.toHaveBeenCalled();
	//
	//			$state.s = 2;
	//			expect(spy).toHaveBeenCalled();
	//			spy.mockReset();
	//
	//			const done2 = e._start();
	//			done2();
	//
	//			$state.s = 3;
	//			expect(spy).not.toHaveBeenCalled();
	//		});
	//
	//		it("should throw on out-of-order start1-start2-end1 sequences", () => {
	//			let e1: any;
	//			$run(function (this: any) {
	//				e1 = this;
	//			});
	//
	//			let e2: any;
	//			$run(function (this: any) {
	//				e2 = this;
	//			});
	//
	//			const done1 = e1._start();
	//			const done2 = e2._start();
	//			try {
	//				expect(() => done1()).toThrow(/Out-of-order/);
	//			} finally {
	//				done2();
	//				done1();
	//			}
	//		});
	//
	//		it("should throw a cycle detection error when _start is called while the effect is running", () => {
	//			let e: any;
	//			$run(function (this: any) {
	//				e = this;
	//			});
	//
	//			const done = e._start();
	//			try {
	//				expect(() => e._start()).toThrow("Cycle detected");
	//			} finally {
	//				done();
	//			}
	//		});
	//
	//		it("should dispose the effect on _dispose", () => {
	//			let $state = $watch({ s: 0 });
	//
	//			let e: any;
	//			$run(function (this: any) {
	//				e = this;
	//			});
	//
	//			let spy = vi.fn();
	//			e._callback = spy;
	//
	//			const done = e._start();
	//			try {
	//				$state.s;
	//			} finally {
	//				done();
	//			}
	//			expect(spy).not.toHaveBeenCalled();
	//
	//			$state.s = 2;
	//			expect(spy).toHaveBeenCalled();
	//			spy.mockReset();
	//
	//			e._dispose();
	//			$state.s = 3;
	//			expect(spy).not.toHaveBeenCalled();
	//		});
	//
	//		it("should allow reusing the effect after disposing it", () => {
	//			let $state = $watch({ s: 0 });
	//
	//			let e: any;
	//			$run(function (this: any) {
	//				e = this;
	//			});
	//
	//			let spy = vi.fn();
	//			e._callback = spy;
	//			e._dispose();
	//
	//			const done = e._start();
	//			try {
	//				$state.s;
	//			} finally {
	//				done();
	//			}
	//			$state.s = 2;
	//			expect(spy).toHaveBeenCalled();
	//		});
	//
	//		it("should have property _sources that is undefined when and only when the effect has no sources", () => {
	//			let $state = $watch({ s: 0 });
	//
	//			let e: any;
	//			$run(function (this: any) {
	//				e = this;
	//			});
	//			expect(e._sources).toBeUndefined();
	//
	//			const done1 = e._start();
	//			try {
	//				$state.s;
	//			} finally {
	//				done1();
	//			}
	//			expect(e._sources).not.toBeUndefined();
	//
	//			const done2 = e._start();
	//			done2();
	//			expect(e._sources).toBeUndefined();
	//
	//			const done3 = e._start();
	//			try {
	//				$state.s;
	//			} finally {
	//				done3();
	//			}
	//			expect(e._sources).not.toBeUndefined();
	//
	//			e._dispose();
	//			expect(e._sources).toBeUndefined();
	//		});
	//	});
});

describe("$derive()", () => {
	it("should return value", () => {
		let $state = $watch({
			a: "a",
			b: "b",
			get c() {
				return $cache(() => $state.a + $state.b);
			},
		});

		expect($state.c).toEqual("ab");
	});

	//	it("should inherit from Signal", () => {
	//		expect($derive(() => 0)).to.be.instanceOf(Signal);
	//	});

	it("should return updated value", () => {
		let $state = $watch({
			a: "a",
			b: "b",
			get c() {
				return $cache(() => $state.a + $state.b);
			},
		});
		expect($state.c).toEqual("ab");

		$state.a = "aa";
		expect($state.c).toEqual("aab");
	});

	it("should be lazily computed on demand", () => {
		let spy = vi.fn(() => $state.a + $state.b);
		let $state = $watch({
			a: "a",
			b: "b",
			get c() {
				return $cache(spy);
			},
		});
		expect(spy).not.toHaveBeenCalled();
		$state.c;
		expect(spy).toHaveBeenCalledOnce();
		$state.a = "x";
		$state.b = "y";
		expect(spy).toHaveBeenCalledOnce();
		$state.c;
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("should be computed only when a dependency has changed at some point", () => {
		let spy = vi.fn(() => {
			return $state.a;
		});
		let $state = $watch({
			a: "a",
			get c() {
				return $cache(spy);
			},
		});
		$state.c;
		expect(spy).toHaveBeenCalledOnce();
		$state.a = "a";
		$state.c;
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should recompute if a dependency changes during computation after becoming a dependency", () => {
		let spy = vi.fn(() => {
			$state.a++;
		});
		let $state = $watch({
			a: 0,
			get c() {
				return $cache(spy);
			},
		});
		$state.c;
		expect(spy).toHaveBeenCalledOnce();
		$state.c;
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("should detect simple dependency cycles", () => {
		const $state = $watch({
			get a(): any {
				return $cache(() => $state.a);
			},
		});
		expect(() => $state.a).toThrow("Cycle detected");
	});

	it("should detect deep dependency cycles", () => {
		const $state = $watch({
			get a(): any {
				return $cache(() => $state.b);
			},
			get b() {
				return $cache(() => $state.c);
			},
			get c() {
				return $cache(() => $state.d);
			},
			get d() {
				return $cache(() => $state.a);
			},
		});
		expect(() => $state.a).toThrow("Cycle detected");
	});

	//	it("should not allow a computed signal to become a direct dependency of itself", () => {
	//		let spy = vi.fn(() => {
	//			try {
	//				$state.a;
	//			} catch {
	//				// pass
	//			}
	//		});
	//		const a = $derive(spy);
	//		$state.a;
	//		expect(() => $run(() => $state.a)).to.not.throw();
	//	});

	it("should store thrown errors and recompute only after a dependency changes", () => {
		let spy = vi.fn(() => {
			$state.a;
			throw new Error();
		});
		let $state = $watch({
			a: 0,
			get c() {
				return $cache(spy);
			},
		});
		expect(() => $state.c).toThrow();
		expect(() => $state.c).toThrow();
		expect(spy).toHaveBeenCalledOnce();
		$state.a = 1;
		expect(() => $state.c).toThrow();
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("should store thrown non-errors and recompute only after a dependency changes", () => {
		let spy = vi.fn();
		let $state = $watch({
			a: 0,
			get c() {
				return $cache(() => {
					$state.a;
					spy();
					throw undefined;
				});
			},
		});
		try {
			$state.c;
			expect.fail();
		} catch (err) {
			expect(err).toBeUndefined();
		}
		try {
			$state.c;
			expect.fail();
		} catch (err) {
			expect(err).toBeUndefined();
		}
		expect(spy).toHaveBeenCalledOnce();

		$state.a = 1;
		try {
			$state.c;
			expect.fail();
		} catch (err) {
			expect(err).toBeUndefined();
		}
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("should conditionally unsubscribe from signals", () => {
		let spy = vi.fn(() => {
			return $state.cond ? $state.a : $state.b;
		});

		let $state = $watch({
			a: "a",
			b: "b",
			cond: true,
			get c() {
				return $cache(spy);
			},
		});

		expect($state.c).toEqual("a");
		expect(spy).toHaveBeenCalledOnce();

		$state.b = "bb";
		expect($state.c).toEqual("a");
		expect(spy).toHaveBeenCalledOnce();

		$state.cond = false;
		expect($state.c).toEqual("bb");
		expect(spy).toHaveBeenCalledTimes(2);

		spy.mockReset();

		$state.a = "aaa";
		expect($state.c).toEqual("bb");
		expect(spy).not.toHaveBeenCalled();
	});

	//	describe(".(un)watched()", () => {
	//		it("should call watched when first subscription occurs", () => {
	//			const watched = vi.fn();
	//			const unwatched = vi.fn();
	//			const s = $derive(() => 1, { watched, unwatched });
	//			expect(watched).not.toHaveBeenCalled();
	//			const unsubscribe = s.subscribe(() => {});
	//			expect(watched).toHaveBeenCalledOnce();
	//			const unsubscribe2 = s.subscribe(() => {});
	//			expect(watched).toHaveBeenCalledOnce();
	//			unsubscribe();
	//			unsubscribe2();
	//			expect(unwatched).toHaveBeenCalledOnce();
	//		});
	//
	//		it("should call watched when first subscription occurs w/ nested signal", () => {
	//			const watched = vi.fn();
	//			const unwatched = vi.fn();
	//			let $state = $watch({ s: 1, { watched, unwatched } });
	//			const c = $derive(() => s.value + 1, { watched, unwatched });
	//			expect(watched).not.toHaveBeenCalled();
	//			const unsubscribe = c.subscribe(() => {});
	//			expect(watched).toHaveBeenCalledTimes(2);
	//			const unsubscribe2 = s.subscribe(() => {});
	//			expect(watched).toHaveBeenCalledTimes(2);
	//			unsubscribe2();
	//			unsubscribe();
	//			expect(unwatched).toHaveBeenCalledTimes(2);
	//		});
	//	});

	it("should consider undefined value separate from uninitialized value", () => {
		let spy = vi.fn(() => undefined);
		let $state = $watch({
			a: 0,
			get c() {
				return $cache(spy);
			},
		});

		expect($state.c).toBeUndefined();
		$state.a = 1;
		expect($state.c).toBeUndefined();
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should not leak errors raised by dependencies", () => {
		let $state = $watch({
			a: 0,
			get b() {
				return $cache(() => {
					$state.a;
					throw new Error("error");
				});
			},
			get c() {
				return $cache(() => {
					try {
						return $state.b;
					} catch {
						return "ok";
					}
				});
			},
		});
		expect($state.c).toEqual("ok");
		$state.a = 1;
		expect($state.c).toEqual("ok");
	});

	it("should propagate notifications even right after first subscription", () => {
		let $state = $watch({
			a: 0,
			get b() {
				return $cache(() => $state.a);
			},
			get c() {
				return $cache(() => $state.b);
			},
		});
		$state.c;

		let spy = vi.fn(() => {
			$state.c;
		});

		$run(spy);
		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$state.a = 1;
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should get marked as outdated right after first subscription", () => {
		let $state = $watch({
			s: 0,
			get c() {
				return $cache(() => $state.s);
			},
		});
		$state.c;

		$state.s = 1;
		$run(() => {
			$state.c;
		});
		expect($state.c).toEqual(1);
	});

	//	it("should propagate notification to other listeners after one listener is disposed", () => {
	//		let $state = $watch({ s: 0 });
	//		const c = $derive(() => s.value);
	//
	//		let spy1 = vi.fn(() => {
	//			$state.c;
	//		});
	//		let spy2 = vi.fn(() => {
	//			$state.c;
	//		});
	//		let spy3 = vi.fn(() => {
	//			$state.c;
	//		});
	//
	//		$run(spy1);
	//		const dispose = $run(spy2);
	//		$run(spy3);
	//
	//		expect(spy1).toHaveBeenCalledOnce();
	//		expect(spy2).toHaveBeenCalledOnce();
	//		expect(spy3).toHaveBeenCalledOnce();
	//
	//		dispose();
	//
	//		$state.s = 1;
	//		expect(spy1).toHaveBeenCalledTimes(2);
	//		expect(spy2).toHaveBeenCalledOnce();
	//		expect(spy3).toHaveBeenCalledTimes(2);
	//	});

	it("should not recompute dependencies out of order", () => {
		let spy = vi.fn(() => $state.c);
		let $state = $watch({
			a: 1,
			b: 1,
			c: 1,
			get d() {
				return $cache(spy);
			},
			get e() {
				return $cache(() => {
					if ($state.a > 0) {
						$state.b;
						$state.d;
					} else {
						$state.b;
					}
					return true;
				});
			},
		});

		$state.e;
		spy.mockReset();

		$state.a = 2;
		$state.b = 2;
		$state.c = 2;
		$state.e;
		expect(spy).toHaveBeenCalledOnce();
		spy.mockReset();

		$state.a = -1;
		$state.b = -1;
		$state.c = -1;
		$state.e;
		expect(spy).not.toHaveBeenCalled();
		spy.mockReset();
	});

	it("should not recompute dependencies unnecessarily", () => {
		let spy = vi.fn();
		let $state = $watch({
			a: 0,
			b: 0,
			get c() {
				return $cache(() => {
					$state.b;
					return spy();
				});
			},
			get d() {
				return $cache(() => {
					if ($state.a === 0) {
						return $state.c;
					}
				});
			},
		});

		$state.d;
		expect(spy).toHaveBeenCalledOnce();

		$batch(() => {
			$state.b = 1;
			$state.a = 1;
		});
		$state.d;
		expect(spy).toHaveBeenCalledOnce();
	});

	describe("$peek()", () => {
		it("should get value", () => {
			let $state = $watch({
				s: 1,
				get c() {
					return $cache(() => $state.s);
				},
			});
			expect($peek(() => $state.c)).equal(1);
		});

		it("should throw when evaluation throws", () => {
			let $state = $watch({
				get c() {
					return $cache(() => {
						throw Error("test");
					});
				},
			});
			expect(() => $peek(() => $state.c)).toThrow("test");
		});

		it("should throw when previous evaluation threw and dependencies haven't changed", () => {
			let $state = $watch({
				get c() {
					return $cache(() => {
						throw Error("test");
					});
				},
			});
			expect(() => $state.c).toThrow("test");
			expect(() => $peek(() => $state.c)).toThrow("test");
		});

		it("should refresh value if stale", () => {
			let $state = $watch({
				a: 1,
				get b() {
					return $cache(() => $state.a);
				},
			});
			expect($peek(() => $state.b)).toEqual(1);

			$state.a = 2;
			expect($peek(() => $state.b)).toEqual(2);
		});

		it("should detect simple dependency cycles", () => {
			const $state = $watch({
				get a(): any {
					return $cache(() => $peek(() => $state.a));
				},
			});
			expect(() => $peek(() => $state.a)).toThrow("Cycle detected");
		});

		it("should detect deep dependency cycles", () => {
			const $state = $watch({
				get a(): any {
					return $cache(() => $state.b);
				},
				get b() {
					return $cache(() => $state.c);
				},
				get c() {
					return $cache(() => $state.d);
				},
				get d() {
					return $cache(() => $peek(() => $state.a));
				},
			});
			expect(() => $peek(() => $state.a)).toThrow("Cycle detected");
		});

		it("should not make surrounding effect depend on the computed", () => {
			let $state = $watch({
				s: 1,
				get c() {
					return $cache(() => $state.s);
				},
			});
			let spy = vi.fn(() => {
				$peek(() => $state.c);
			});

			$run(spy);
			expect(spy).toHaveBeenCalledOnce();

			$state.s = 2;
			expect(spy).toHaveBeenCalledOnce();
		});

		it("should not make surrounding computed depend on the $derive", () => {
			let spy = vi.fn(() => {
				$peek(() => $state.c);
			});

			let $state = $watch({
				s: 1,
				get c() {
					return $cache(() => $state.s);
				},
				get d() {
					return $cache(spy);
				},
			});
			$state.d;
			expect(spy).toHaveBeenCalledOnce();

			$state.s = 2;
			$state.d;
			expect(spy).toHaveBeenCalledOnce();
		});

		it("should not make surrounding effect depend on the peeked computed's dependencies", () => {
			let $state = $watch({
				a: 1,
				get b() {
					return $cache(() => $state.a);
				},
			});

			let spy = vi.fn();
			$run(() => {
				spy();
				$peek(() => $state.b);
			});
			expect(spy).toHaveBeenCalledOnce();
			spy.mockReset();

			$state.a = 1;
			expect(spy).not.toHaveBeenCalled();
		});

		it("should not make surrounding computed depend on peeked $derive's dependencies", () => {
			let spy = vi.fn();
			let $state = $watch({
				a: 1,
				get b() {
					return $cache(() => $state.a);
				},
				get d() {
					spy();
					return $cache(() => $peek(() => $state.b));
				},
			});
			$state.d;
			expect(spy).toHaveBeenCalledOnce();
			spy.mockReset();

			$state.a = 1;
			$state.d;
			expect(spy).not.toHaveBeenCalled();
		});
	});

	//	describe("garbage collection", function () {
	//		// Skip GC tests if window.gc/global.gc is not defined.
	//		before(function () {
	//			if (typeof gc === "undefined") {
	//				this.skip();
	//			}
	//		});
	//
	//		it("should be garbage collectable if nothing is listening to its changes", async () => {
	//			let $state = $watch({ s: 0 });
	//			const ref = new WeakRef($derive(() => s.value));
	//
	//			(gc as () => void)();
	//			await new Promise((resolve) => setTimeout(resolve, 0));
	//			(gc as () => void)();
	//			expect(ref.deref()).toBeUndefined();
	//		});
	//
	//		it("should be garbage collectable after it has lost all of its listeners", async () => {
	//			let $state = $watch({ s: 0 });
	//
	//			let ref: WeakRef<ReadonlySignal>;
	//			let dispose: () => void;
	//			(function () {
	//				const c = $derive(() => s.value);
	//				ref = new WeakRef(c);
	//				dispose = $run(() => {
	//					$state.c;
	//				});
	//			})();
	//
	//			dispose();
	//			(gc as () => void)();
	//			await new Promise((resolve) => setTimeout(resolve, 0));
	//			(gc as () => void)();
	//			expect(ref.deref()).toBeUndefined();
	//		});
	//	});

	describe("graph updates", () => {
		it("should run computeds once for multiple dep changes", async () => {
			const compute = vi.fn(() => {
				// debugger;
				return $state.a + $state.b;
			});
			let $state = $watch({
				a: "a",
				b: "b",
				get c() {
					return $cache(() => compute());
				},
			});

			expect($state.c).toEqual("ab");
			expect(compute).toHaveBeenCalledOnce();
			compute.mockReset();

			$state.a = "aa";
			$state.b = "bb";
			$state.c;
			expect(compute).toHaveBeenCalledOnce();
		});

		it("should drop A->B->A updates", async () => {
			const compute = vi.fn(() => "d: " + $state.c);

			//     A
			//   / |
			//  B  | <- Looks like a flag doesn't it? :D
			//   \ |
			//     C
			//     |
			//     D
			let $state = $watch({
				a: 2,
				get b() {
					return $cache(() => $state.a - 1);
				},
				get c() {
					return $cache(() => $state.a + $state.b);
				},
				get d() {
					return $cache(() => compute());
				},
			});

			// Trigger read
			expect($state.d).toEqual("d: 3");
			expect(compute).toHaveBeenCalledOnce();
			compute.mockReset();

			$state.a = 4;
			$state.d;
			expect(compute).toHaveBeenCalledOnce();
		});

		it("should only update every signal once (diamond graph)", () => {
			let spy = vi.fn(() => $state.b + " " + $state.c);

			// In this scenario "D" should only update once when "A" receives
			// an update. This is sometimes referred to as the "diamond" scenario.
			//     A
			//   /   \
			//  B     C
			//   \   /
			//     D
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => $state.a);
				},
				get c() {
					return $cache(() => $state.a);
				},
				get d() {
					return $cache(spy);
				},
			});

			expect($state.d).toEqual("a a");
			expect(spy).toHaveBeenCalledOnce();

			$state.a = "aa";
			expect($state.d).toEqual("aa aa");
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it("should only update every signal once (diamond graph + tail)", () => {
			let spy = vi.fn(() => $state.d);

			// "E" will be likely updated twice if our mark+sweep logic is buggy.
			//     A
			//   /   \
			//  B     C
			//   \   /
			//     D
			//     |
			//     E
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => $state.a);
				},
				get c() {
					return $cache(() => $state.a);
				},
				get d() {
					return $cache(() => $state.b + " " + $state.c);
				},
				get e() {
					return $cache(spy);
				},
			});

			expect($state.e).toEqual("a a");
			expect(spy).toHaveBeenCalledOnce();

			$state.a = "aa";
			expect($state.e).toEqual("aa aa");
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it("should bail out if result is the same", () => {
			let spy = vi.fn(() => $state.b);

			// Bail out if value of "B" never changes
			// A->B->C
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => {
						$state.a;
						return "foo";
					});
				},
				get c() {
					return $cache(spy);
				},
			});

			expect($state.c).toEqual("foo");
			expect(spy).toHaveBeenCalledOnce();

			$state.a = "aa";
			expect($state.c).toEqual("foo");
			expect(spy).toHaveBeenCalledOnce();
		});

		it("should only update every signal once (jagged diamond graph + tails)", () => {
			const eSpy = vi.fn();
			const fSpy = vi.fn();
			const gSpy = vi.fn();

			// "F" and "G" will be likely updated twice if our mark+sweep logic is buggy.
			//     A
			//   /   \
			//  B     C
			//  |     |
			//  |     D
			//   \   /
			//     E
			//   /   \
			//  F     G
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => $state.a);
				},
				get c() {
					return $cache(() => $state.a);
				},
				get d() {
					return $cache(() => $state.c);
				},
				get e() {
					return $cache(() => {
						eSpy();
						return $state.b + " " + $state.d;
					});
				},
				get f() {
					return $cache(() => {
						fSpy();
						return $state.e;
					});
				},
				get g() {
					return $cache(() => {
						gSpy();
						return $state.e;
					});
				},
			});

			expect($state.f).toEqual("a a");
			expect(fSpy).toHaveBeenCalledOnce();

			expect($state.g).toEqual("a a");
			expect(gSpy).toHaveBeenCalledOnce();

			eSpy.mockReset();
			fSpy.mockReset();
			gSpy.mockReset();

			$state.a = "b";

			expect($state.e).toEqual("b b");
			expect(eSpy).toHaveBeenCalledOnce();

			expect($state.f).toEqual("b b");
			expect(fSpy).toHaveBeenCalledOnce();

			expect($state.g).toEqual("b b");
			expect(gSpy).toHaveBeenCalledOnce();

			eSpy.mockReset();
			fSpy.mockReset();
			gSpy.mockReset();

			$state.a = "c";

			expect($state.e).toEqual("c c");
			expect(eSpy).toHaveBeenCalledOnce();

			expect($state.f).toEqual("c c");
			expect(fSpy).toHaveBeenCalledOnce();

			expect($state.g).toEqual("c c");
			expect(gSpy).toHaveBeenCalledOnce();

			// top to bottom
			expect(eSpy).toHaveBeenCalledBefore(fSpy);
			// left to right
			expect(fSpy).toHaveBeenCalledBefore(gSpy);
		});

		it("should only subscribe to signals listened to", () => {
			let spy = vi.fn(() => $state.a);

			//    *A
			//   /   \
			// *B     C <- we don't listen to C
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => $state.a);
				},
				get c() {
					return $cache(spy);
				},
			});

			expect($state.b).toEqual("a");
			expect(spy).not.toHaveBeenCalled();

			$state.a = "aa";
			expect($state.b).toEqual("aa");
			expect(spy).not.toHaveBeenCalled();
		});

		//		it("should only subscribe to signals listened to", () => {
		//			// Here both "B" and "C" are active in the beginning, but
		//			// "B" becomes inactive later. At that point it should
		//			// not receive any updates anymore.
		//			//    *A
		//			//   /   \
		//			// *B     D <- we don't listen to C
		//			//  |
		//			// *C
		//			let $state = $watch({ a: "a" });
		//			let spyB = vi.fn(() => $state.a);
		//			const b = $derive(spyB);
		//
		//			let spyC = vi.fn(() => $state.b);
		//			const c = $derive(spyC);
		//
		//			const d = $derive(() => $state.a);
		//
		//			let result = "";
		//			const unsub = $run(() => {
		//				result = $state.c;
		//			});
		//
		//			expect(result).toEqual("a");
		//			expect($state.d).toEqual("a");
		//
		//			spyB.mockReset();
		//			spyC.mockReset();
		//			unsub();
		//
		//			$state.a = "aa";
		//
		//			expect(spyB).not.toHaveBeenCalled();
		//			expect(spyC).not.toHaveBeenCalled();
		//			expect($state.d).toEqual("aa");
		//		});

		it("should ensure subs update even if one dep unmarks it", () => {
			let spy = vi.fn(() => $state.b + " " + $state.c);

			// In this scenario "C" always returns the same value. When "A"
			// changes, "B" will update, then "C" at which point its update
			// to "D" will be unmarked. But "D" must still update because
			// "B" marked it. If "D" isn't updated, then we have a bug.
			//     A
			//   /   \
			//  B     *C <- returns same value every time
			//   \   /
			//     D
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => $state.a);
				},
				get c() {
					return $cache(() => {
						$state.a;
						return "c";
					});
				},
				get d() {
					return $cache(spy);
				},
			});

			expect($state.d).toEqual("a c");
			spy.mockReset();

			$state.a = "aa";
			$state.d;
			expect(spy).toHaveLastReturnedWith("aa c");
		});

		it("should ensure subs update even if two deps unmark it", () => {
			let spy = vi.fn(() => $state.b + " " + $state.c + " " + $state.d);

			// In this scenario both "C" and "D" always return the same
			// value. But "E" must still update because "A"  marked it.
			// If "E" isn't updated, then we have a bug.
			//     A
			//   / | \
			//  B *C *D
			//   \ | /
			//     E
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => $state.a);
				},
				get c() {
					return $cache(() => {
						$state.a;
						return "c";
					});
				},
				get d() {
					return $cache(() => {
						$state.a;
						return "d";
					});
				},
				get e() {
					return $cache(spy);
				},
			});
			expect($state.e).toEqual("a c d");
			spy.mockReset();

			$state.a = "aa";
			$state.e;
			expect(spy).toHaveLastReturnedWith("aa c d");
		});
	});

	describe("error handling", () => {
		//		it("should throw when writing to computeds", () => {
		//			let $state = $watch({ a: "a" });
		//			const b = $derive(() => $state.a);
		//			const fn = () => ((b as $state.Signal) = "aa");
		//			expect(fn).toThrow(/Cannot set property value/);
		//		});

		it("should keep graph consistent on errors during activation", () => {
			let $state = $watch({
				a: 0,
				get b() {
					return $cache(() => {
						throw new Error("fail");
					});
				},
				get c() {
					return $cache(() => $state.a);
				},
			});
			expect(() => $state.b).toThrow("fail");

			$state.a = 1;
			expect($state.c).toEqual(1);
		});

		it("should keep graph consistent on errors in computeds", () => {
			let $state = $watch({
				a: 0,
				get b() {
					return $cache(() => {
						if ($state.a === 1) throw new Error("fail");
						return $state.a;
					});
				},
				get c() {
					return $cache(() => $state.b);
				},
			});
			expect($state.c).toEqual(0);

			$state.a = 1;
			expect(() => $state.b).toThrow("fail");

			$state.a = 2;
			expect($state.c).toEqual(2);
		});

		it("should support lazy branches", () => {
			let $state = $watch({
				a: 0,
				get b() {
					return $cache(() => $state.a);
				},
				get c() {
					return $cache(() => ($state.a > 0 ? $state.a : $state.b));
				},
			});

			expect($state.c).toEqual(0);
			$state.a = 1;
			expect($state.c).toEqual(1);

			$state.a = 0;
			expect($state.c).toEqual(0);
		});

		it("should not update a sub if all deps unmark it", () => {
			let spy = vi.fn(() => $state.b + " " + $state.c);

			// In this scenario "B" and "C" always return the same value. When "A"
			// changes, "D" should not update.
			//     A
			//   /   \
			// *B     *C
			//   \   /
			//     D
			let $state = $watch({
				a: "a",
				get b() {
					return $cache(() => {
						$state.a;
						return "b";
					});
				},
				get c() {
					return $cache(() => {
						$state.a;
						return "c";
					});
				},
				get d() {
					return $cache(spy);
				},
			});

			expect($state.d).toEqual("b c");
			spy.mockReset();

			$state.a = "aa";
			expect(spy).not.toHaveBeenCalled();
		});
	});
});

describe("$batch()", () => {
	//	it("should return the value from the callback", () => {
	//		expect($batch(() => 1)).toEqual(1);
	//	});
	//
	//	it("should throw errors thrown from the callback", () => {
	//		expect(() =>
	//			$batch(() => {
	//				throw Error("hello");
	//			}),
	//		).toThrow("hello");
	//	});
	//
	//	it("should throw non-errors thrown from the callback", () => {
	//		try {
	//			$batch(() => {
	//				throw undefined;
	//			});
	//			expect.fail();
	//		} catch (err) {
	//			expect(err).toBeUndefined();
	//		}
	//	});

	it("should delay writes", () => {
		let $state = $watch({ a: "a", b: "b" });
		let spy = vi.fn(() => {
			$state.a + " " + $state.b;
		});
		$run(spy);
		spy.mockReset();

		$batch(() => {
			$state.a = "aa";
			$state.b = "bb";
		});

		expect(spy).toHaveBeenCalledOnce();
	});

	it("should delay writes until outermost batch is complete", () => {
		let $state = $watch({ a: "a", b: "b" });
		let spy = vi.fn(() => {
			$state.a + ", " + $state.b;
		});
		$run(spy);
		spy.mockReset();

		$batch(() => {
			$batch(() => {
				$state.a += " inner";
				$state.b += " inner";
			});
			$state.a += " outer";
			$state.b += " outer";
		});

		// If the inner $batch() would have flushed the update
		// this spy would've been called twice.
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should read signals written to", () => {
		let $state = $watch({ a: "a" });

		let result = "";
		$batch(() => {
			$state.a = "aa";
			result = $state.a;
		});

		expect(result).toEqual("aa");
	});

	it("should read computed signals with updated source signals", () => {
		let spyC = vi.fn(() => $state.b);
		let spyD = vi.fn(() => $state.c);
		let spyE = vi.fn(() => $state.d);

		// A->B->C->D->E
		let $state = $watch({
			a: "a",
			get b() {
				return $cache(() => $state.a);
			},
			get c() {
				return $cache(() => spyC());
			},
			get d() {
				return $cache(() => spyD());
			},
			get e() {
				return $cache(() => spyE());
			},
		});

		spyC.mockReset();
		spyD.mockReset();
		spyE.mockReset();

		let result = "";
		$batch(() => {
			$state.a = "aa";
			result = $state.c;

			// Since "D" isn't accessed during batching, we should not
			// update it, only after batching has completed
			expect(spyD).not.toHaveBeenCalled();
		});

		expect(result).toEqual("aa");
		expect($state.d).toEqual("aa");
		expect($state.e).toEqual("aa");
		expect(spyC).toHaveBeenCalledOnce();
		expect(spyD).toHaveBeenCalledOnce();
		expect(spyE).toHaveBeenCalledOnce();
	});

	it("should not block writes after batching completed", () => {
		// If no further writes after $batch() are possible, than we
		// didn't restore state properly. Most likely "pending" still
		// holds elements that are already processed.
		let $state = $watch({
			a: "a",
			b: "b",
			c: "c",
			get d() {
				return $cache(() => $state.a + " " + $state.b + " " + $state.c);
			},
		});

		let result;
		$run(() => {
			result = $state.d;
		});

		$batch(() => {
			$state.a = "aa";
			$state.b = "bb";
		});

		$state.c = "cc";
		expect(result).toEqual("aa bb cc");
	});

	it("should not lead to stale signals with .value in batch", () => {
		const invokes: number[][] = [];
		let $state = $watch({
			counter: 0,
			get double() {
				return $cache(() => this.counter * 2);
			},
			get triple() {
				return $cache(() => this.counter * 3);
			},
		});

		$run(() => {
			invokes.push([$state.double, $state.triple]);
		});

		expect(invokes).to.deep.equal([[0, 0]]);

		$batch(() => {
			$state.counter = 1;
			expect($state.double).toEqual(2);
		});

		expect(invokes[1]).to.deep.equal([2, 3]);
	});

	it("should not lead to stale signals with peek() in batch", () => {
		const invokes: number[][] = [];
		let $state = $watch({
			counter: 0,
			get double() {
				return $cache(() => this.counter * 2);
			},
			get triple() {
				return $cache(() => this.counter * 3);
			},
		});

		$run(() => {
			invokes.push([$state.double, $state.triple]);
		});

		expect(invokes).to.deep.equal([[0, 0]]);

		$batch(() => {
			$state.counter = 1;
			expect($peek(() => $state.double)).toEqual(2);
		});

		expect(invokes[1]).to.deep.equal([2, 3]);
	});

	it("should run pending effects even if the callback throws", () => {
		let $state = $watch({ a: 0, b: 1 });
		let spy1 = vi.fn(() => {
			$state.a;
		});
		let spy2 = vi.fn(() => {
			$state.b;
		});
		$run(spy1);
		$run(spy2);
		spy1.mockReset();
		spy2.mockReset();

		expect(() =>
			$batch(() => {
				$state.a++;
				$state.b++;
				throw Error("hello");
			}),
		).toThrow("hello");

		expect(spy1).toHaveBeenCalledOnce();
		expect(spy2).toHaveBeenCalledOnce();
	});

	it("should run pending effects even if some effects throw", () => {
		let $state = $watch({ a: 0 });
		let spy1 = vi.fn(() => {
			$state.a;
		});
		let spy2 = vi.fn(() => {
			$state.a;
		});
		$run(() => {
			if ($state.a === 1) {
				throw new Error("hello");
			}
		});
		$run(spy1);
		$run(() => {
			if ($state.a === 1) {
				throw new Error("hello");
			}
		});
		$run(spy2);
		$run(() => {
			if ($state.a === 1) {
				throw new Error("hello");
			}
		});
		spy1.mockReset();
		spy2.mockReset();

		expect(() =>
			$batch(() => {
				$state.a++;
			}),
		).toThrow("hello");

		expect(spy1).toHaveBeenCalledOnce();
		expect(spy2).toHaveBeenCalledOnce();
	});

	it("should run effect's first run immediately even inside a batch", () => {
		//let callCount = 0;
		let spy = vi.fn();
		$batch(() => {
			$run(spy);
			//callCount = spy.callCount;
			expect(spy).toHaveBeenCalledOnce();
		});
		//expect(callCount).toBe(1);
	});
});

describe("untracked ($peek)", () => {
	it("should block tracking inside effects", () => {
		let $state = $watch({ a: 1, b: 2 });
		let spy = vi.fn(() => {
			$state.a + $state.b;
		});
		$run(() => $peek(spy));
		expect(spy).toHaveBeenCalledOnce();

		$state.a = 10;
		$state.b = 20;
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should block tracking even when run inside effect run inside untracked", () => {
		let $state = $watch({ s: 1 });
		let spy = vi.fn(() => $state.s);

		$peek(() =>
			$run(() => {
				$peek(spy);
			}),
		);
		expect(spy).toHaveBeenCalledOnce();

		$state.s = 2;
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should not cause signal assignments throw", () => {
		let $state = $watch({ a: 1, aChangedTime: 0 });

		/*const dispose =*/ $run(() => {
			//dev.log("RUNNING");
			$state.a;
			$peek(() => {
				$state.aChangedTime = $state.aChangedTime + 1;
			});
		});
		expect(() => ($state.a = 2)).not.toThrow();
		expect($state.aChangedTime).toEqual(2);
		$state.a = 3;
		expect($state.aChangedTime).toEqual(3);

		//dispose();
	});

	it("should block tracking inside computed signals", () => {
		let spy = vi.fn(() => $state.a + $state.b);
		let $state = $watch({
			a: 1,
			b: 2,
			get c() {
				return $cache(() => $peek(spy));
			},
		});

		expect(spy).not.toHaveBeenCalled();
		expect($state.c).toEqual(3);
		$state.a = 10;
		$state.c;
		$state.b = 20;
		$state.c;
		expect(spy).toHaveBeenCalledOnce();
		expect($state.c).toEqual(3);
	});
});
