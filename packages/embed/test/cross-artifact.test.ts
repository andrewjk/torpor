import { expect, test } from "vite-plus/test";
import {
	compileRestricted,
	deriveRequirementKind,
	renderRestricted,
	restrictedComponent,
} from "../src/restricted";
import { hydrateEmbed, loadComponent } from "../src";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const ROWS = [
	{ id: 1, title: "Fix login", priority: 2 },
	{ id: 2, title: "Add dark mode", priority: 1 },
];

const INNER = `
data tickets from rows { };

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
	return compileRestricted("ticket-list", INNER, { requirementKinds: KINDS });
}

function outerArtifact(): EmbedArtifact {
	return compileRestricted("board", OUTER_SOURCE);
}

test("a restricted artifact renders another restricted artifact", async () => {
	const { body, head } = await renderRestricted(outerArtifact(), {
		components: {
			TicketList: restrictedComponent(innerArtifact(), {
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

test("a restricted component slot renders its fallback without incoming fills", async () => {
	// An outer template that renders the inner component bare: the inner
	// default slot falls back to <span>{t.title}</span>.
	const source = `
export default function Plain() {
	@render {
		<TicketList />
	}
}
`;
	const plain = compileRestricted("plain", source);
	const { body } = await renderRestricted(plain, {
		components: {
			TicketList: restrictedComponent(innerArtifact(), {
				sources: { rows: () => ROWS },
			}),
		},
	});
	expect(body).toContain("<span>Fix login</span>");
	expect(body).toContain("<span>Add dark mode</span>");
	expect(body).toContain("<p>default footer</p>");
});

test("restrictedComponent rejects non-restricted artifacts", () => {
	expect(() =>
		restrictedComponent({
			id: "js-embed",
			name: "X",
			version: "1",
			source: "",
			format: "globals",
			client: { code: "" },
		} as never),
	).toThrow(/is not a restricted artifact/);
});

test("hydration: the inner artifact's client build renders via scope", async () => {
	const inner = innerArtifact();
	const outer = outerArtifact();
	const { body } = await renderRestricted(outer, {
		components: {
			TicketList: restrictedComponent(inner, { sources: { rows: () => ROWS } }),
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
