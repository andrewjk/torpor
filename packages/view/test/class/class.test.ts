import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	red: boolean;
	green: boolean;
	blue: boolean;
}

const source = `
export default function Class() {
	@render {
		<div id="divid">
			From id
		</div>

		<div class="divclass">
			From string
		</div>

		<a class={{ hello: true, red: $props.red, green: $props.green, blue: $props.blue }}>
			From state
		</a>

		<div class={{ hello: true, red: $props.red, green: $props.green, blue: $props.blue }}>
			From state with scope
		</div>

		<div class={{ foo: true, bar: false, baz: 5, qux: null }}>
			Class object
		</div>

		<div class={[ "foo", false, true && "baz", undefined ]}>
			Class array
		</div>

		<div class={[ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ]}>
			Class nested
		</div>

		<Child class={{ "child-class": true }} />
	}

	@style {
		div {
			color: blue;
		}
	}
}

function Child() {
	@render {
		<div class={$props.class}>
			Child class
		</div>
	}
}
`;

test("class -- mounted", async () => {
	let $state = $watch({
		red: true,
		green: false,
		blue: true,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("class -- hydrated", async () => {
	let $state = $watch({
		red: true,
		green: false,
		blue: true,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "From id")).not.toBeNull();
	expect(queryByText(container, "From id")).toHaveClass("torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "From string")).not.toBeNull();
	expect(queryByText(container, "From string")).toHaveClass("divclass torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "From state")).not.toBeNull();
	expect(queryByText(container, "From state")).toHaveClass("hello red blue torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "From state with scope")).not.toBeNull();
	expect(queryByText(container, "From state with scope")).toHaveClass(
		"hello red blue torp-1ljxz83",
		{
			exact: true,
		},
	);

	expect(queryByText(container, "Class object")).not.toBeNull();
	expect(queryByText(container, "Class object")).toHaveClass("foo baz torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "Class array")).not.toBeNull();
	expect(queryByText(container, "Class array")).toHaveClass("foo baz torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "Class nested")).not.toBeNull();
	expect(queryByText(container, "Class nested")).toHaveClass("foo bar baz qux torp-1ljxz83", {
		exact: true,
	});

	// Change state
	state.green = true;
	state.blue = false;

	expect(queryByText(container, "From state")).toHaveClass("hello red green torp-1ljxz83", {
		exact: true,
	});

	// Components
	expect(queryByText(container, "Child class")).not.toBeNull();
	expect(queryByText(container, "Child class")).toHaveClass("child-class torp-1ljxz83", {
		exact: true,
	});
}
