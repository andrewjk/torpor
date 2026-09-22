import { type Template, build, parse } from "@torpor/view/compile";
import { type UnpluginFactory, type UnpluginInstance } from "unplugin";
import { createUnplugin } from "unplugin";
import { transformWithOxc } from "vite";
import type Options from "./types";

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
		// Copy the factory options instead of mutating them, so that the
		// per-request dev/server overrides below don't stick around and
		// surprise the next request
		let transformOptions: Options = { ...options };

		// We may be in dev mode
		if (viteOptions && viteOptions.dev !== undefined) {
			transformOptions.dev = viteOptions.dev;
		}

		// An explicit ?client or ?server query on the import overrides
		// everything else -- e.g. importing `Component.torp?client` in a test
		// run compiles the component for the client, so that it can be
		// mounted, while other components stay SSR-compiled
		const query = getQuery(id);
		if (query?.has("client")) {
			transformOptions.server = false;
		} else if (query?.has("server")) {
			transformOptions.server = true;
		} else {
			// Vite can override user server options
			if (viteOptions && viteOptions.ssr !== undefined) {
				transformOptions.server = viteOptions.ssr;
			}

			// But when testing we always generate for the server
			if (transformOptions.test) {
				transformOptions.server = true;
			}
		}

		// Try to parse the code
		let parsed = parse(code);
		if (parsed.ok && parsed.template) {
			// Transform for server or client
			return transform(parsed.template, id, transformOptions);
		} else {
			// Show an error component
			let name = id
				.split(/[\\/]/)
				.at(-1)
				.replace(/\.torp.*$/, "")!;
			let errorMessages = parsed.errors.map(
				(e) => `${e.startLine + 1},${e.startChar}: ${e.message}`,
			);
			console.log(`\nERRORS: ${id}\n======\n${errorMessages.join("\n")}`);
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
				return transform(errorParsed.template, id, transformOptions);
			}
			// This should never be reached, but just in case...
			throw new Error(`Parse failed for ${id}, ${errorMessages.join("\n")}`);
		}
	},
});

/**
 * Gets the query string of a module id (e.g. `client` for `Foo.torp?client`)
 */
function getQuery(id: string): URLSearchParams | undefined {
	const queryStart = id.lastIndexOf("?");
	if (queryStart === -1) {
		return undefined;
	}
	return new URLSearchParams(id.substring(queryStart + 1));
}

function transform(template: Template, id: string, options?: Options) {
	const built = build(template, options);
	let transformed = built.code;

	// When a component is compiled for the client in a test run, any child
	// components it imports must also be compiled for the client -- otherwise
	// mounting the parent would try to render SSR children (which don't show
	// anything). Pass the ?client query on to imported components
	if (options?.test && options.server === false) {
		transformed = transformed.replace(/(from\s*['"])([^'"]+\.torp)(['"])/g, "$1$2?client$3");
	}

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
	return transformWithOxc(transformed, id.replace(/\.torp.*$/, ".ts"));
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

export const unplugin: UnpluginInstance<Options | undefined, boolean> =
	/* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
