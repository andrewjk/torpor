import { expect, test } from "vite-plus/test";
import compileEmbed from "../src/server/compileEmbed";
import getRuntimeVersion from "../src/server/getRuntimeVersion";
import EmbedCompileError from "../src/types/EmbedCompileError";
import viewPkg from "../../view/package.json";

const SOURCE = `
export default function Counter($props: { start?: number }) {
	let count = $watch({ value: $props.start ?? 0 });
	function increment() {
		count.value++;
	}
	@render {
		<button onclick={increment}>Count: {count.value}</button>
	}
	@style {
		button {
			color: red;
		}
	}
}
`;

test("compiles source into an artifact", () => {
	const artifact = compileEmbed("counter-1", SOURCE);

	expect(artifact.id).toBe("counter-1");
	expect(artifact.name).toBe("Counter");
	expect(artifact.version).toBe(getRuntimeVersion());
	expect(artifact.source).toBe(SOURCE);
	expect(artifact.styles.length).toBe(1);
	expect(artifact.styles[0].style).toContain("color: red");
	expect(artifact.styles[0].hash).toBeTruthy();
});

test("stamps the artifact with the installed @torpor/view version", () => {
	const artifact = compileEmbed("counter-1", SOURCE);
	expect(artifact.version).toBe(viewPkg.version);
});

test("client code runs against injected globals: no imports, no exports, no types", () => {
	const artifact = compileEmbed("counter-1", SOURCE);
	const code = artifact.client.code;

	expect(code).not.toMatch(/^import\s/m);
	expect(code).not.toMatch(/export\s+default\s+function/);
	expect(code).not.toMatch(/:\s*\{?\s*start\??:/);
	expect(code).toContain("function Counter(");
	expect(code).toContain("$watch");
	expect(code).toContain("t_add_element");
});

test("server code is an ES module that imports from @torpor/view/ssr", () => {
	const artifact = compileEmbed("counter-1", SOURCE);
	const code = artifact.server.code;

	expect(code).toMatch(/import\s.+from\s.+@torpor\/view\/ssr/);
	expect(code).not.toMatch(/export\s+default\s+function/);
	expect(code).not.toMatch(/:\s*\{?\s*start\??:/);
});

test("throws EmbedCompileError with sorted errors on invalid source", () => {
	try {
		compileEmbed("bad-1", "@if (");
		expect.unreachable();
	} catch (e) {
		expect(e).toBeInstanceOf(EmbedCompileError);
		const error = e as EmbedCompileError;
		const indexes = error.errors.map((error) => error.startIndex);
		expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
	}
});

test("throws when the source has no default export component", () => {
	const source = `
export function Helper() {
	@render {
		<p>hi</p>
	}
}
`;
	try {
		compileEmbed("no-default", source);
		expect.unreachable();
	} catch (e) {
		expect(e).toBeInstanceOf(EmbedCompileError);
		expect((e as EmbedCompileError).message).toContain("default export");
	}
});

test("getRuntimeVersion returns the installed @torpor/view version", () => {
	expect(getRuntimeVersion()).toBe(viewPkg.version);
});
