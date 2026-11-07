import { expect, test } from "vite-plus/test";
import { compileRestricted, renderRestricted } from "../src/restricted";
import { hydrateEmbed, mountEmbed } from "../src";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const COUNTER_SOURCE = `
export default function Counter($props: { start?: number }) {
	let $state = $watch({ count: $props.start ?? 0 });
	function increment() {
		$state.count++;
	}
	@render {
		<button onclick={increment}>Count: {$state.count}</button>
	}
}
`;

function counterArtifact(): EmbedArtifact {
	return compileRestricted("counter", COUNTER_SOURCE);
}

test("restricted templates render client state as the initial paint", async () => {
	const { body } = await renderRestricted(counterArtifact(), { props: { start: 5 } });
	expect(body).toContain("Count: 5");
});

test("state initializers must reference only $props", () => {
	expect(() =>
		compileRestricted(
			"bad-init",
			`
export default function Bad($props: {}) {
	let $state = $watch({ x: getInitial() });
	@render { <p>{$state.x}</p> }
}
`,
		),
	).toThrow(/Function calls aren't supported/);

	expect(() =>
		compileRestricted(
			"bad-init-2",
			`
export default function Bad($props: {}) {
	let $state = $watch({ x: $data.y });
	@render { <p>{$state.x}</p> }
}
`,
		),
	).toThrow(/state initializer/);
});

test("unknown template identifiers are compile errors, not render errors", () => {
	const typo = `
export default function Typo($props: {}) {
	@render {
		<p>{$data.tickts}</p>
	}
}
`;
	// $data is a known root; the property typo is a render-time value
	expect(() => compileRestricted("typo-ok", typo)).not.toThrow();

	const unknownRoot = `
export default function UnknownRoot($props: {}) {
	@render {
		<p>{$stat.count}</p>
	}
}
`;
	expect(() => compileRestricted("unknown-root", unknownRoot)).toThrow(
		/Unknown identifier "\$stat"/,
	);
});

test("hydration: client state takes over from the SSR paint", async () => {
	const artifact = counterArtifact();
	const { body } = await renderRestricted(artifact, { props: { start: 3 } });

	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);

	const handle = hydrateEmbed(target, artifact, { start: 3 }, { styles: false });
	const button = target.querySelector("button")!;

	// SSR painted 3; hydration bound the real $watch at 3
	expect(button.textContent).toBe("Count: 3");
	button.click();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(button.textContent).toBe("Count: 4");

	handle.unmount();
});

test("client handlers mutate restricted state (reactive list)", async () => {
	const source = `
export default function Notes() {
	let $state = $watch({ items: ["first"] });
	function add() {
		$state.items.push("another");
	}
	@render {
		<ul>
			@for (item of $state.items) {
				<li>{item}</li>
			}
		</ul>
		<button onclick={add}>Add</button>
	}
}
`;
	const artifact = compileRestricted("notes", source);

	// SSR: initial items only
	const { body } = await renderRestricted(artifact, {});
	expect(body).toContain("first");
	expect(body).not.toContain("another");

	// Client: mount fresh, click Add, reactive list grows
	const target = document.createElement("div");
	document.body.appendChild(target);
	mountEmbed(target, artifact, {});

	target.querySelector("button")!.dispatchEvent(new Event("click", { bubbles: true }));
	await new Promise((resolve) => setTimeout(resolve, 10));

	const items = [...target.querySelectorAll("li")].map((li) => li.textContent);
	expect(items).toEqual(["first", "another"]);
});

test("loop variables and state coexist in scope", async () => {
	const source = `
export default function Labels($props: { prefix: string }) {
	let $state = $watch({ words: ["a", "b"], suffix: "!" });
	@render {
		@for (word of $state.words) {
			<span>{$props.prefix}-{word}{$state.suffix}</span>
		}
	}
}
`;
	const artifact = compileRestricted("labels", source);
	const { body } = await renderRestricted(artifact, { props: { prefix: "hi" } });
	expect(body).toContain("<span>hi-a!</span>");
	expect(body).toContain("<span>hi-b!</span>");
});
