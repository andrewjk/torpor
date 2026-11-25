import { build, parse } from "@torpor/view/compile";
import { transform } from "sucrase";
import runtime from "@torpor/view/runtime?raw";

/** The result of compiling the REPL's input. */
export type ReplResult =
	| { ok: true; output: string }
	| { ok: false; errors: { message: string; startIndex: number }[] };

/**
 * Compiles the REPL's input into a standalone HTML document for its output
 * iframe. This is the heavy part of the REPL (the compiler, sucrase and the
 * view runtime), so `Repl.torp` loads it with a dynamic import when the REPL
 * comes near the viewport, rather than every page that has a REPL loading it
 * up front.
 */
export default function compileRepl(input: string): ReplResult {
	let parsed = parse(input);
	if (!parsed.ok) {
		return { ok: false, errors: parsed.errors.sort((a, b) => a.startIndex - b.startIndex) };
	}

	let component = build(parsed.template!);
	let output = `
<html>
<head>
${component.styles.map((s) => `<style>${s.style}</style>`).join("\n")}
<script>${runtime};Object.assign(globalThis, TorporView);</script>
<script>${
		transform(
			component.code
				.replaceAll("export default function", "function")
				.replaceAll("export function", "function")
				.replace(/^import\s.+\n/gm, ""),
			{ transforms: ["typescript"] },
		).code
	}</script>
</head>
<body>
<div id="repl-target"></div>
<script>
const target = document.getElementById("repl-target");
try {
	mount(target, ${parsed.template!.components.find((c) => c.default)!.name});
} catch (error) {
	target.innerHTML = '<span style="color: red"><p>Script syntax error</p><p>' + error + '</p></span>';
}
</script>
</body>
</html>
`.trimStart();
	return { ok: true, output };
}
