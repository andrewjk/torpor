import { bindDataTemplate, build, parse } from "@torpor/view/compile";
import * as ssr from "@torpor/view/ssr";
import { transform } from "sucrase";
import { expect, test } from "vite-plus/test";
import {
	compileArtifact,
	deriveRequirementKind,
	renderArtifact,
	artifactComponent,
} from "../src/artifact";
import { hydrateEmbed, loadComponent } from "../src";
import EmbedCompileError from "../src/types/EmbedCompileError";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const ROWS = [
	{ id: 1, title: "Fix login", priority: 2 },
	{ id: 2, title: "Add dark mode", priority: 1 },
];

const INNER = `
export default function TicketList() {
	@render {
		@for (t of $data.tickets) {
			<div class="row">
				<slot item={t}><span>{t.title}</span></slot>
			</div>
		}
		<footer>
			<slot name="footer"><p>default footer</p></slot>
		</footer>
	}
}
`;

// The outer artifact: renders the inner one as a component, passing an
// element fill that reads the inner slot props, and no footer fill (so the
// inner fallback shows).
const OUTER_SOURCE = `
export default function Board() {
	@render {
		<TicketList>
			<b>{$slot.item.title} ({$slot.item.priority})</b>
		</TicketList>
	}
}
`;

const KINDS = { rows: () => {}, derive: deriveRequirementKind };

function innerArtifact(): EmbedArtifact {
	return compileArtifact("ticket-list", INNER, {
		requirementKinds: KINDS,
		data: { tickets: { kind: "rows" } },
	});
}

function outerArtifact(): EmbedArtifact {
	return compileArtifact("board", OUTER_SOURCE);
}

test("an artifact renders another artifact", async () => {
	const { body, head } = await renderArtifact(outerArtifact(), {
		components: {
			TicketList: artifactComponent(innerArtifact(), {
				sources: { rows: () => ROWS },
			}),
		},
	});

	// The inner artifact's data requirement resolved through the wrapper's
	// own sources; the outer's fill rendered per row with the inner's slot
	// props ($slot.item).
	expect(body).toContain("<b>Fix login (2)</b>");
	expect(body).toContain("<b>Add dark mode (1)</b>");
	// The named slot with no incoming fill renders the inner fallback
	expect(body).toContain("<p>default footer</p>");
	expect(head).toBe("");
});

test("an artifact component slot renders its fallback without incoming fills", async () => {
	// An outer template that renders the inner component bare: the inner
	// default slot falls back to <span>{t.title}</span>.
	const source = `
export default function Plain() {
	@render {
		<TicketList />
	}
}
`;
	const plain = compileArtifact("plain", source);
	const { body } = await renderArtifact(plain, {
		components: {
			TicketList: artifactComponent(innerArtifact(), {
				sources: { rows: () => ROWS },
			}),
		},
	});
	expect(body).toContain("<span>Fix login</span>");
	expect(body).toContain("<span>Add dark mode</span>");
	expect(body).toContain("<p>default footer</p>");
});

test("artifactComponent rejects artifacts without a server build", () => {
	expect(() =>
		artifactComponent({
			id: "js-embed",
			name: "X",
			version: "1",
			source: "",
			format: "globals",
			client: { code: "" },
		} as never),
	).toThrow(/missing its server build/);
});

test("hydration: the inner artifact's client build renders via scope", async () => {
	const inner = innerArtifact();
	const outer = outerArtifact();
	const { body } = await renderArtifact(outer, {
		components: {
			TicketList: artifactComponent(inner, { sources: { rows: () => ROWS } }),
		},
	});

	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);

	// The inner artifact's client build handles slots natively; the host
	// adapts the $data bag through props (same contract as hydration).
	const data = { tickets: ROWS };
	const innerClient = loadComponent(inner, {}) as (
		parent: any,
		anchor: any,
		props: any,
		context: any,
		slots: any,
	) => void;
	const handle = hydrateEmbed(
		target,
		outer,
		{},
		{
			styles: false,
			scope: {
				ui: {
					TicketList: ($p: any, $a: any, usageProps: any, $c: any, slots: any) =>
						innerClient($p, $a, { ...usageProps, $data: data }, $c, slots),
				},
			},
		},
	);

	expect(target.querySelectorAll("div.row").length).toBe(2);
	expect(target.textContent).toContain("Fix login");
	handle.unmount();
});

const INNER_STYLED_SOURCE = `
export default function TicketList() {
	@style {
		.row { padding: 4px; }
	}
	@render {
		@for (t of $data.tickets) {
			<div class="row">
				<slot item={t}><span>{t.title}</span></slot>
			</div>
		}
	}
}
`;

/** Compiles a torp source into a server component, with the SSR runtime
 * exports in scope (same harness as artifact-components.test.ts). */
function compileServerComponent(source: string): unknown {
	const parsed = parse(source, { allowUnknownComponents: true });
	// The source reads `$data` from the injected bag; the JS build needs the
	// same binding the manifest path installs
	bindDataTemplate(parsed.template!);
	const built = build(parsed.template!, { server: true, source });
	// Strip imports before the TS transform (sucrase hoists helpers above them)
	const code = built.code.replace("export default ", "").replace(/^import\s.+\n/gm, "");
	const js = transform(code, { transforms: ["typescript"] }).code;
	const name = parsed.template!.components.find((component) => component.default)!.name!;
	const make = new Function(...Object.keys(ssr), `${js}\nreturn ${name};`); // eslint-disable-line no-implied-eval
	return make(...Object.values(ssr));
}

test("inner artifact styles flow through the boundary like the JS build", async () => {
	const inner = compileArtifact("ticket-list-styled", INNER_STYLED_SOURCE, {
		requirementKinds: KINDS,
		data: { tickets: { kind: "rows" } },
	});
	const outer = compileArtifact("board-styled", OUTER_SOURCE);

	const { body, head } = await renderArtifact(outer, {
		components: {
			TicketList: artifactComponent(inner, { sources: { rows: () => ROWS } }),
		},
	});

	// Reference: the same outer source through the real JS server build,
	// with the JS-built inner component in scope (its style tag lands in
	// head exactly the way the wrapper must emit it).
	const parsedPage = parse(OUTER_SOURCE, { allowUnknownComponents: true });
	const builtPage = build(parsedPage.template!, { server: true, source: OUTER_SOURCE });
	const codePage = builtPage.code.replace("export default ", "").replace(/^import\s.+\n/gm, "");
	const jsPage = transform(codePage, { transforms: ["typescript"] }).code;
	const namePage = parsedPage.template!.components.find((component) => component.default)!.name!;
	const makePage = new Function(
		...Object.keys(ssr),
		"TicketList",
		`${jsPage}\nreturn ${namePage};`,
	); // eslint-disable-line no-implied-eval
	// The JS inner reads $data through props, exactly like the artifact
	// client build — adapt it the same way the host adapts at hydration.
	const innerJs = compileServerComponent(INNER_STYLED_SOURCE) as any;
	const adaptedInner = async (props: any, context: any, slots: any) =>
		innerJs({ ...props, $data: { tickets: ROWS } }, context, slots);
	const page = makePage(...Object.values(ssr), adaptedInner);
	const reference = (await page({})) as { body: string; head: string };

	expect(body).toBe(reference.body);
	expect(head).toBe(reference.head);
	expect(head).toContain("<style id='");
	expect(head).toContain("padding: 4px");
});

const INNER_LI_SOURCE = `
export default function TicketListLi() {
	@render {
		@for (t of $data.tickets) {
			<li><slot item={t} /></li>
		}
	}
}
`;

const OUTER_LI_SOURCE = `
export default function BoardLi() {
	@render {
		<TicketListLi>
			<li><b>{$slot.item.title}</b></li>
		</TicketListLi>
	}
}
`;

test("slot fills that auto-close the wrapper throw at render time", async () => {
	const inner = compileArtifact("ticket-list-li", INNER_LI_SOURCE, {
		requirementKinds: KINDS,
		data: { tickets: { kind: "rows" } },
	});
	const outer = compileArtifact("board-li", OUTER_LI_SOURCE);
	await expect(
		renderArtifact(outer, {
			components: {
				TicketListLi: artifactComponent(inner, { sources: { rows: () => ROWS } }),
			},
		}),
	).rejects.toThrow(/re-nested by the HTML parser/);
	await expect(
		renderArtifact(outer, {
			components: {
				TicketListLi: artifactComponent(inner, { sources: { rows: () => ROWS } }),
			},
		}),
	).rejects.toThrow(/auto-closes the enclosing <li>/);
});

test("slot fallbacks that auto-close the wrapper are compile errors", () => {
	const source = `
export default function Bad() {
	@render {
		<li><slot item={t}><li>bad fallback</li></slot></li>
	}
}
`;
	let thrown: unknown;
	try {
		compileArtifact("bad-fallback", source);
	} catch (error) {
		thrown = error;
	}
	expect(thrown).toBeInstanceOf(EmbedCompileError);
	const messages = (thrown as EmbedCompileError).errors.map((error) => error.message).join("\n");
	expect(messages).toContain("auto-closes the enclosing <li>");
	expect(messages).toContain("re-nested by the HTML parser");
});
