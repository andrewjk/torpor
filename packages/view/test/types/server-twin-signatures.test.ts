import { expect, test } from "vite-plus/test";
import * as client from "../../src/index";
import * as server from "../../src/ssr";

/**
 * Compile-time guard: each client `$x` primitive and its `ssr/$serverX.ts`
 * twin must expose exactly the same signature. The server builds swap the
 * implementations, so if a client signature gains a parameter (or changes a
 * return type) without the stub following, server-compiled code would drift
 * from the client API.
 *
 * The assertions below are checked by `tsgo --noEmit`; the test runner only
 * transpiles, so the runtime test exists to keep this a runnable module.
 */
type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

export type _Watch = Assert<Equal<typeof client.$watch, typeof server.$watch>>;
export type _Bind = Assert<Equal<typeof client.$bind, typeof server.$bind>>;
export type _Cache = Assert<Equal<typeof client.$cache, typeof server.$cache>>;
export type _Run = Assert<Equal<typeof client.$run, typeof server.$run>>;
export type _Onmount = Assert<Equal<typeof client.$onmount, typeof server.$onmount>>;
export type _Stream = Assert<Equal<typeof client.$stream, typeof server.$stream>>;
export type _Unwrap = Assert<Equal<typeof client.$unwrap, typeof server.$unwrap>>;
export type _Peek = Assert<Equal<typeof client.$peek, typeof server.$peek>>;
export type _Batch = Assert<Equal<typeof client.$batch, typeof server.$batch>>;
export type _Async = Assert<Equal<typeof client.$async, typeof server.$async>>;
export type _Pending = Assert<Equal<typeof client.$pending, typeof server.$pending>>;
export type _Refresh = Assert<Equal<typeof client.$refresh, typeof server.$refresh>>;

test("server primitives mirror the client signatures", () => {
	// The `_X` aliases above are the actual check (compile-time). Keep a small
	// runtime assertion so the file has a test.
	expect(typeof server.$watch).toBe("function");
	expect(typeof server.$run).toBe("function");
	expect(typeof server.$refresh).toBe("function");
});
