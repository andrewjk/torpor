import { type Template, build, parse } from "@tera/view/compile";
import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { transformWithEsbuild } from "vite";
import type { Options } from "./types";

const styles = new Map<string, string>();

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => ({
	name: "unplugin-tera",
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
		// Check for *.tera files
		return /\.tera\?*/.test(id);
	},
	transform(code, id) {
		// Get the component's name from the file id
		let name = id
			.split(/[\\\/]/)
			.at(-1)
			?.replace(/\.tera$/, "")!;

		// Try to parse the code
		const parsed = parse(code);
		if (parsed.ok && parsed.template) {
			// Transform for server or client
			return transform(parsed.template, id, options);
		} else {
			console.log("\nERRORS\n======");
			let errorText = "";
			for (let error of parsed.errors) {
				//const line = (input.slice(0, error.i).match(/\n/g) || "").length + 1;
				let slice = code.slice(0, error.start);
				let line = 1;
				let lastLineIndex = 0;
				for (let i = 0; i < slice.length; i++) {
					if (code[i] === "\n") {
						line += 1;
						lastLineIndex = i;
					}
				}
				console.log(`${line},${error.start - lastLineIndex - 1}: ${error.message}`);
				errorText += `${line},${error.start - lastLineIndex - 1}: ${error.message}\n`;
			}
			throw new Error(`Parse failed for ${id}, ${errorText}`);
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

function printTransformed(transformed: string) {
	console.log(
		transformed
			.split("\n")
			.map((l, i) => `${(i + 1).toString().padEnd(3)} ${l}`)
			.join("\n"),
	);
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
