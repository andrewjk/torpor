// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vite-plus/test";
import loadData from "../src/nav/loadData";
import type RouteHandler from "../src/types/RouteHandler";

const plainHandler = {
	path: "/plain",
	type: 0,
	endPoint: () => Promise.resolve({ default: {} }),
} satisfies RouteHandler;

const serverHandler = {
	...plainHandler,
	serverEndPoint: () => Promise.resolve({ default: {} }),
} satisfies RouteHandler;

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

test("loadData reads the embedded server data and skips the fetch", async () => {
	document.body.innerHTML =
		'<script type="application/json" id="t-server-data">{"loads":[{"from":"server"},null]}</script>';
	const fetchSpy = vi.fn();
	vi.stubGlobal("fetch", fetchSpy);

	const result = await loadData(plainHandler, {}, "/plain", new URLSearchParams(), [], undefined);

	expect(fetchSpy).not.toHaveBeenCalled();
	expect(result?.data).toEqual({ from: "server" });
	// Consumed once, so a later navigation can't reuse it
	expect(document.getElementById("t-server-data")).toBeNull();
});

test("loadData falls back to fetching when there is no embedded payload", async () => {
	const fetchSpy = vi.fn(async () => Response.json({ loads: [{ from: "fetch" }, null] }));
	vi.stubGlobal("fetch", fetchSpy);

	const result = await loadData(serverHandler, {}, "/plain", new URLSearchParams(), [], undefined);

	expect(fetchSpy).toHaveBeenCalledTimes(1);
	expect(result?.data).toEqual({ from: "fetch" });
});
