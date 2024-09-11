import fs from "fs";
import path, { normalize } from "path";
import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { transformWithEsbuild } from "vite";
import build from "../../view/src/compile/build";
import parse from "../../view/src/compile/parse";
import ComponentTemplate from "../../view/src/compile/types/ComponentTemplate";
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
		// Try to parse the code
		const parsed = parse(code);
		if (parsed.ok && parsed.template) {
			// Get the component's name from the file id
			const name = id
				.split(/[\\\/]/)
				.at(-1)
				?.replace(/\.tera$/, "")!;

			// Transform for server or client
			if (options?.server) {
				return transformForServer(name, parsed.template, id);
			} else {
				return transform(name, parsed.template, id);
			}
		} else {
			console.log("\nERRORS\n======");
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
			}
			throw new Error(`Parse failed for ${id}`);
		}
	},
});

function transform(name: string, template: ComponentTemplate, id: string) {
	const built = build(name, template);
	let transformed = built.code;

	// HACK: Replace import paths from any depth with absolute paths
	transformed = normalizeImportPaths(transformed, id);

	if (built.styles && built.styleHash) {
		// Add a dynamic import for the component's CSS with a name from
		// the hash and add the styles to a map. Then resolveId will
		// pass the CSS id onto load, which will load the the actual CSS
		// from the map
		transformed = `import '${built.styleHash}.css';\n` + transformed;
		styles.set(built.styleHash + ".css", built.styles);
	}

	//printTransformed(transformed);

	// TODO: Compile typescript only if script lang="ts" or config.lang="ts"
	return transformWithEsbuild(transformed, id, {
		loader: "ts",
	});
}

function transformForServer(name: string, template: ComponentTemplate, id: string) {
	const built = build(name, template, { server: true });
	let transformed = built.code;

	// HACK: Replace import paths from any depth with absolute paths
	transformed = normalizeImportPaths(transformed, id);

	// TODO: What to do with styles
	if (built.styles && built.styleHash) {
		// Add a dynamic import for the component's CSS with a name from
		// the hash and add the styles to a map. Then resolveId will
		// pass the CSS id onto load, which will load the the actual CSS
		// from the map
		transformed = `import '${built.styleHash}.css';\n` + transformed;
		styles.set(built.styleHash + ".css", built.styles);
	}

	//printTransformed(transformed);

	// TODO: Compile typescript only if script lang="ts" or config.lang="ts"
	return transformWithEsbuild(transformed, id, {
		loader: "ts",
	});
}

function normalizeImportPaths(transformed: string, id: string): string {
	// HACK: Replace import paths from any depth with absolute paths
	if (transformed.includes("../../../tera")) {
		const pathParts = id.split(/[\\\/]/);
		for (let i = pathParts.length - 1; i >= 0; i--) {
			let resolvedPath = path.resolve(path.join(...["/", ...pathParts.slice(0, i), "tera"]));
			if (fs.existsSync(resolvedPath)) {
				transformed = transformed.replaceAll(/from ("|')(..\/)+tera/g, `from $1${resolvedPath}`);
				break;
			}
		}
	}
	return transformed;
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
