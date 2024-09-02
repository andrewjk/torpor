import "@testing-library/jest-dom/vitest";
import { afterAll, describe, expect, test, vi } from "vitest";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/Console.tera";

describe("console", () => {
	const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

	afterAll(() => {
		consoleMock.mockReset();
	});

	test("console", async () => {
		let { Component } = await importComponent(expect, componentFile);

		const container = document.createElement("div");
		mountComponent(container, Component);

		//expect(consoleMock).toHaveBeenCalledOnce();
		expect(consoleMock).toHaveBeenCalledWith("@console is logging here");
	});
});
