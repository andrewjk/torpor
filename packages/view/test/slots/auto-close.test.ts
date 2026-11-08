import { build, parse } from "@torpor/view/compile";
import * as ssr from "@torpor/view/ssr";
import { transform } from "sucrase";
import { expect, test } from "vite-plus/test";

// The broken shape: the host wraps each row in <li> and the fill root is
// also an <li> — the HTML parser auto-closes the wrapper, shredding the
// slot region. SSR must throw with an actionable message.
const BROKEN_SOURCE = `
export default function Page($props: { items: Row[] }) {
	@render {
		<Host items={$props.items}>
			<li><b>{$slot.item.text}</b></li>
		</Host>
	}
}

function Host($props: { items: Row[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li><slot item={item} /></li>
			}
		</ul>
	}
}
`;

// The valid shape: the wrapper and the fill root nest cleanly.
const VALID_SOURCE = `
export default function Page($props: { items: Row[] }) {
	@render {
		<Host items={$props.items}>
			<b>{$slot.item.text}</b>
		</Host>
	}
}

function Host($props: { items: Row[] }) {
	@render {
		@for (let item of $props.items) {
			<div class="row"><slot item={item} /></div>
		}
	}
}
`;

const ITEMS = [{ text: "item 1" }, { text: "item 2" }];

/** SSR-renders a source through the real server build (eval harness). */
async function renderServer(source: string): Promise<string> {
	const parsed = parse(source);
	const built = build(parsed.template!, { server: true, source });
	// Strip imports before the TS transform (sucrase hoists helpers above them)
	const code = built.code.replace("export default ", "").replace(/^import\s.+\n/gm, "");
	const js = transform(code, { transforms: ["typescript"] }).code;
	const name = parsed.template!.components.find((component) => component.default)!.name!;
	const make = new Function(...Object.keys(ssr), `${js}\nreturn ${name};`); // eslint-disable-line no-implied-eval
	const component = make(...Object.values(ssr)) as any;
	const result = (await component({ items: ITEMS })) as { body: string };
	return result.body;
}

test("a slot fill that auto-closes the wrapper throws at SSR", async () => {
	await expect(renderServer(BROKEN_SOURCE)).rejects.toThrow(/re-nested by the HTML parser/);
	await expect(renderServer(BROKEN_SOURCE)).rejects.toThrow(/auto-closes the enclosing <li>/);
});

test("parse-stable shapes render without the guard firing", async () => {
	const body = await renderServer(VALID_SOURCE);
	expect(body).toContain("item 1");
	expect(body).toContain("item 2");
	expect(body).not.toContain("re-nested");
});
