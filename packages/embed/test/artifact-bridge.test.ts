import { expect, test, vi } from "vite-plus/test";
import { createBridge, hydrateEmbed } from "../src";
import { compileArtifact, renderArtifact } from "../src/artifact";

const SOURCE = `
export default function Sign($props: { $embed?: any }) {
	let $state = $watch({ name: "", status: "" });

	async function sign() {
		const reply = await $props.$embed.invoke("submit", { name: $state.name });
		$state.status = reply.ok ? "signed" : "failed";
	}

	@render {
		<div>
			<input value={$state.name} oninput={(e) => { $state.name = e.currentTarget.value; }} />
			<button onclick={sign}>Sign</button>
			<p>{$state.status}</p>
		</div>
	}
}
`;

test("artifact handlers can invoke the host bridge", async () => {
	const artifact = compileArtifact("sign", SOURCE, { api: { submit: {} } });

	// Paint server-side first (empty form), then hydrate with a bridge
	const rendered = await renderArtifact(artifact, {});
	// The server bridge must not leak into the render result — a serialized
	// `$embed` would win over the client bridge at hydration
	expect(rendered.props).not.toHaveProperty("$embed");

	const target = document.createElement("div");
	target.innerHTML = rendered.body;
	document.body.appendChild(target);

	const invoke = vi.fn(async (method: string, payload: unknown) => ({
		ok: true,
		method,
		payload,
	}));
	const handle = hydrateEmbed(target, artifact, rendered.props, {
		bridge: createBridge({ invoke }),
		styles: false,
	});

	const input = target.querySelector("input")!;
	input.value = "Ada";
	input.dispatchEvent(new Event("input", { bubbles: true }));
	(target.querySelector("button") as HTMLButtonElement).click();
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(invoke).toHaveBeenCalledTimes(1);
	expect(invoke.mock.calls[0]![0]).toBe("submit");
	expect(invoke.mock.calls[0]![1]).toEqual({ name: "Ada" });
	expect(target.textContent).toContain("signed");

	handle.unmount();
});
