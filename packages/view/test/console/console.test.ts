import "@testing-library/jest-dom/vitest";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/console/components/Console";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

describe("console", () => {
	const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

	afterAll(() => {
		consoleMock.mockReset();
	});

	test("console", async () => {
		const container = document.createElement("div");
		const component = await importComponent(componentPath, "client");
		mountComponent(container, component);

		//expect(consoleMock).toHaveBeenCalledOnce();
		expect(consoleMock).toHaveBeenCalledWith("@console is logging here");
	});
});
