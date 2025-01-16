import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import tsb from "ts-blank-space";
import { beforeAll, expect, test } from "vitest";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

test("build for the server and render to HTML", () => {
	// This is just a simple test -- server building gets tested thoroughly when
	// each test is run in hydration mode
	const state = { counter: 8 };

	let path = "./test/build-server/components/IfNested.torp";
	if (!fs.existsSync(path)) {
		path = "./view/test/build-server/components/IfNested.torp";
	}
	const source = fs.readFileSync(path).toString();

	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);
	expect(parsed.template).not.toBeUndefined();

	const rendered = build(parsed.template!, { server: true });
	const code = tsb(`
${rendered.code.replace("export default ", "").replace("import ", "//import ")}
IfNested;
`);
	const html = eval(code)(state);

	const container = document.createElement("div");
	container.innerHTML = html;
	document.body.appendChild(container);

	expect(queryByText(container, "It's both true!")).toBeNull();
	expect(queryByText(container, "The second is not true!")).not.toBeNull();
	expect(queryByText(container, "The first is not true!")).toBeNull();
});
