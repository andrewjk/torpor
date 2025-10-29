import "@testing-library/jest-dom/vitest";
import { afterAll, describe, expect, test, vi } from "vitest";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Console() {
	@render {
		<div>
			@console.log("@console is logging here")
		</div>
	}
}
`;

describe("console", () => {
	const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

	afterAll(() => {
		consoleMock.mockReset();
	});

	test("console", async () => {
		const container = document.createElement("div");
		const component = await importComponent(import.meta.filename, source, "client");
		mountComponent(container, component);

		//expect(consoleMock).toHaveBeenCalledOnce();
		expect(consoleMock).toHaveBeenCalledWith("@console is logging here");
	});
});
