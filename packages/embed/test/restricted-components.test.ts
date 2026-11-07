import { expect, test } from "vite-plus/test";
import { build, parse } from "@torpor/view/compile";
import * as view from "@torpor/view";
import * as ssr from "@torpor/view/ssr";
import { transform } from "sucrase";
import { compileRestricted, renderRestricted } from "../src/restricted";
import { hydrateEmbed } from "../src";
import type EmbedArtifact from "../src/types/EmbedArtifact";

// SSR parity uses an element fill (the general shape); hydration uses a text
// fill (see FOLLOWUP.md: eval-hydrated element-root fills mis-adopt regions).
const PAGE_SOURCE = `
export default function Page($props: { items: Row[] }) {
	@render {
		<List items={$props.items}>
			<li><a href={"#/tickets/" + $slot.item.id}>{$slot.item.title}</a></li>
		</List>
	}
}
`;

const PAGE_TEXT_SOURCE = `
export default function PageText($props: { items: Row[] }) {
	@render {
		<List items={$props.items}>
			{$slot.item.title}
		</List>
	}
}
`;

const LIST_SOURCE = `
export default function List($props: { items: Row[] }) {
	@render {
		<ul>
			@for (row of $props.items) {
				<li><slot item={row} /></li>
			}
		</ul>
	}
}
`;

const ROWS = [
	{ id: 1, title: "Fix login" },
	{ id: 2, title: "Add dark mode" },
];

/** Compiles a torp source into a client component function, with the view
 * runtime exports in scope (as the loader would provide them). */
function compileClientComponent(source: string): unknown {
	const parsed = parse(source);
	const built = build(parsed.template!, { server: false });
	const code = built.code.replace("export default ", "").replace(/^import\s.+\n/gm, "");
	const js = transform(code, { transforms: ["typescript"] }).code;
	const name = parsed.template!.components.find((component) => component.default)!.name!;
	const make = new Function(...Object.keys(view), `${js}\nreturn ${name};`); // eslint-disable-line no-implied-eval
	return make(...Object.values(view));
}

/** Compiles a torp source into a server component, with the SSR runtime
 * exports in scope. */
function compileServerComponent(source: string): unknown {
	const parsed = parse(source);
	const built = build(parsed.template!, { server: true, source });
	// Strip imports before the TS transform (sucrase hoists helpers above them)
	const code = built.code.replace("export default ", "").replace(/^import\s.+\n/gm, "");
	const js = transform(code, { transforms: ["typescript"] }).code;
	const name = parsed.template!.components.find((component) => component.default)!.name!;
	const make = new Function(...Object.keys(ssr), `${js}\nreturn ${name};`); // eslint-disable-line no-implied-eval
	return make(...Object.values(ssr));
}

test("slot props flow from host server components through fills", async () => {
	const listServer = compileServerComponent(LIST_SOURCE);
	const artifact = compileRestricted("page", PAGE_SOURCE);
	const { body, head } = await renderRestricted(artifact, {
		components: { List: listServer as never },
		props: { items: ROWS },
	});

	// Byte parity: the interpreter output equals the real JS server build
	// composing the same components with the same fills.
	const parsedPage = parse(PAGE_SOURCE);
	const builtPage = build(parsedPage.template!, { server: true, source: PAGE_SOURCE });
	const codePage = builtPage.code.replace("export default ", "").replace(/^import\s.+\n/gm, "");
	const jsPage = transform(codePage, { transforms: ["typescript"] }).code;
	const namePage = parsedPage.template!.components.find((component) => component.default)!.name!;
	const makePage = new Function(...Object.keys(ssr), "List", `${jsPage}\nreturn ${namePage};`); // eslint-disable-line no-implied-eval
	const page = makePage(...Object.values(ssr), listServer);
	const reference = (await page({ items: ROWS })) as { body: string };
	expect(body).toBe(reference.body);

	expect(body).toContain('href="#/tickets/1"');
	expect(body).toContain("Fix login");
	expect(head).toBe("");
});

test("slot renders receive the props the host component passes", async () => {
	const seen: unknown[] = [];
	const echoServer = async (
		_props: unknown,
		_context: unknown,
		slots: Record<string, (props?: Record<string, unknown>) => Promise<string>>,
	) => {
		const first = await slots._({ id: 9, title: "Echo" });
		seen.push(first);
		return { body: first, head: "" };
	};

	const source = `
export default function EchoPage() {
	@render {
		<Echo>
			<p>{$slot.title}</p>
		</Echo>
	}
}
`;
	const { body } = await renderRestricted(compileRestricted("echo", source), {
		components: { Echo: echoServer as never },
	});
	expect(body).toContain("<p>Echo</p>");
	expect(seen.length).toBe(1);
});

test("$slot outside fills is a compile error", () => {
	const source = `
export default function Outside() {
	@render {
		<p>{$slot.item}</p>
	}
}
`;
	expect(() => compileRestricted("outside", source)).toThrow(/Unknown identifier "\$slot"/);
});

test("hydration: the client host component renders the restricted fills", async () => {
	const artifact: EmbedArtifact = compileRestricted("page-text", PAGE_TEXT_SOURCE);
	const { body } = await renderRestricted(artifact, {
		props: { items: ROWS },
		components: { List: compileServerComponent(LIST_SOURCE) as never },
	});

	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);

	// The client List component resolves from scope at hydrate time
	const clientList = compileClientComponent(LIST_SOURCE);
	const handle = hydrateEmbed(
		target,
		artifact,
		{ items: ROWS },
		{
			styles: false,
			scope: { "@host/ui": { List: clientList } },
		},
	);

	// Hydration adopts the SSR content
	expect(target.querySelectorAll("li").length).toBe(2);
	expect(target.textContent).toContain("Fix login");

	handle.unmount();
});
