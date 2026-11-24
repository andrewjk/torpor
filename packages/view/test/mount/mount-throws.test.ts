import { expect, test } from "vite-plus/test";
import context from "../../src/render/context";
import mount from "../../src/render/mount";
import unmount from "../../src/render/unmount";
import importComponent from "../importComponent";

const throwingSource = `
export default function MountThrows($props: { log: string[], shouldThrow: boolean }) {
	$run(() => {
		$props.log.push("run");
		return () => $props.log.push("cleanup");
	});

	if ($props.shouldThrow) throw new Error("boom");

	@render {
		<p>ok</p>
	}
}
`;

const goodSource = `
export default function GoodMount() {
	@render {
		<p>good</p>
	}
}
`;

test("a mount whose render throws leaves the render context clean", async () => {
	const log: string[] = [];
	const throwing = await importComponent(import.meta.filename, throwingSource, "client");
	const good = await importComponent(import.meta.filename, goodSource, "client");

	const container = document.createElement("div");
	document.body.appendChild(container);

	expect(() => mount(container, throwing, { log, shouldThrow: true })).toThrow("boom");

	// The partial render's effects are disposed, and the context no longer
	// points at the half-built tree
	expect(log).toContain("cleanup");
	expect(context.rootRegion).toBeNull();
	expect(context.activeRegion).toBeNull();

	// A later mount must be treated as a root mount: it renders, and
	// unmounting it tears the root context down again
	const other = document.createElement("div");
	document.body.appendChild(other);
	mount(other, good, {});

	expect(other.querySelector("p")!.textContent).toBe("good");
	expect(context.rootRegion).not.toBeNull();

	unmount(other);
	expect(context.rootRegion).toBeNull();
});
