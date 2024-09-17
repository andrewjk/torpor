import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import fs from "fs";
import { expect, test } from "vitest";
import build from "../../src/build";
import parse from "../../src/parse";

test("build for the server and render to HTML", () => {
	// This is just a simple test -- server building gets tested thoroughly when
	// each test is run in hydration mode
	const state = { counter: 8 };

	let path = "./test/build-server/components/IfNested.tera";
	if (!fs.existsSync(path)) {
		path = "./view/test/build-server/components/IfNested.tera";
	}
	const source = fs.readFileSync(path).toString();

	const parsed = parse("x", source);
	expect(parsed.ok).toBe(true);
	expect(parsed.template).not.toBeUndefined();

	const rendered = build("IfNested", parsed.template!, { server: true });
	const code = rendered.code.replace("export default", "");
	const html = eval(code).render(state);

	const container = document.createElement("div");
	container.innerHTML = html;
	document.body.appendChild(container);

	expect(queryByText(container, "It's both true!")).toBeNull();
	expect(queryByText(container, "The second is not true!")).toBeInTheDocument();
	expect(queryByText(container, "The first is not true!")).toBeNull();
});
