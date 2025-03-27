import { type Template, build, parse } from "@torpor/view/compile";
import { type UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { transformWithEsbuild } from "vite";
import { type Options } from "./types";

const styles = new Map<string, string>();

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => ({
	name: "unplugin-torpor",
	resolveId(id /*, importer, options*/) {
		if (styles.has(id)) {
			return id;
		}
		return undefined;
	},
	load(id) {
		if (styles.has(id)) {
			return styles.get(id);
		}
		return undefined;
	},
	transformInclude(id) {
		// Check for *.torp files
		return /\.torp\?*/.test(id);
	},
	// @ts-ignore
	transform(code, id, viteOptions) {
		// Vite can override user server options
		if (options && viteOptions && viteOptions.ssr !== undefined) {
			options.server = viteOptions.ssr;
		}

		// Try to parse the code
		let parsed = parse(code);
		if (parsed.ok && parsed.template) {
			// Transform for server or client
			return transform(parsed.template, id, options);
		} else {
			// Show an error component
			let name = id
				.split(/[\\\/]/)
				.at(-1)
				?.replace(/\.torp$/, "")!;
			let errorMessages = parsed.errors.map((e) => `${e.line},${e.column}: ${e.message}`);
			console.log(`\nERRORS\n======\n${errorMessages.join("\n")}`);
			let errorCode = `
export default function Error() {
	@render {
		<div style="background-color: #222; color: #f44"; font-size: 15px; line-height: 1.5;">
			<p style="margin: 0; padding: 0;">
				<strong>Error${parsed.errors.length === 1 ? "" : "s"} in ${name}:</strong>
			</p>
			<ul style="margin: 0; padding: 0 20px">
				${errorMessages.map((e) => `<li>${e}</li>`).join("\n")}
			</ul>
		</div>
	}
}`;
			let errorParsed = parse(errorCode);
			if (errorParsed.ok && errorParsed.template) {
				return transform(errorParsed.template, id, options);
			}
			// This should never be reached, but just in case...
			throw new Error(`Parse failed for ${id}, ${errorMessages.join("\n")}`);
		}
	},
});

function transform(template: Template, id: string, options?: Options) {
	const built = build(template, options);
	let transformed = built.code;

	if (built.styles) {
		for (let style of built.styles) {
			// Add a dynamic import for the component's CSS with a name from
			// the hash and add the styles to a map. Then resolveId will
			// pass the CSS id onto load, which will load the the actual CSS
			// from the map
			transformed = `import '${style.hash}.css';\n` + transformed;
			styles.set(style.hash + ".css", style.style);
		}
	}

	//printTransformed(transformed);

	// TODO: Compile typescript only if script lang="ts" or config.lang="ts"
	return transformWithEsbuild(transformed, id, {
		loader: "ts",
	});
}

/*
function printTransformed(transformed: string) {
	console.log(
		transformed
			.split("\n")
			.map((l, i) => `${(i + 1).toString().padEnd(3)} ${l}`)
			.join("\n"),
	);
}
*/

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
