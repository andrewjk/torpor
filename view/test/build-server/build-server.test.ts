import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import fs from "fs";
import { expect, test } from "vitest";
import renderer from "../../src/compile/buildServer";
import parse from "../../src/compile/parse";

test("build for the server and render to HTML", () => {
	// This is just a simple test -- server building gets tested thoroughly when
	// each test is run in hydration mode
	const state = { counter: 8 };

	const source = fs.readFileSync("./test/build-server/components/IfNested.tera").toString();

	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	expect(parsed.template).not.toBeUndefined();

	const rendered = renderer("IfNested", parsed.template!);
	const html = eval(rendered.code).render(state);

	const container = document.createElement("div");
	container.innerHTML = html;
	document.body.appendChild(container);

	expect(queryByText(container, "It's both true!")).toBeNull();
	expect(queryByText(container, "The second is not true!")).toBeInTheDocument();
	expect(queryByText(container, "The first is not true!")).toBeNull();
});
