import type Template from "../types/Template";
import buildCode from "./build/client/buildCode";
import buildStyles from "./build/client/buildStyles";
import buildServerCode from "./build/server/buildServerCode";
import type BuildOptions from "./types/BuildOptions";
import type BuildResult from "./types/BuildResult";
import type SourceMapping from "./types/SourceMapping";
import trimWhitespace from "./utils/trimWhitespace";

/**
 * Builds a component template into code and styles for rendering
 *
 * @param template The component template, possibly including script, markup and styles
 *
 * @returns The component's code and styles
 */
export default function build(template: Template, options?: BuildOptions): BuildResult {
	// Trim whitespace text nodes (Svelte 5-style) unless explicitly disabled.
	// The pass mutates the tree in place but is idempotent, so it is safe even
	// when build is called twice (client + server) on the same template.
	if (!options?.preserveWhitespace) {
		for (const component of template.components) {
			if (component.markup) trimWhitespace(component.markup);
			if (component.head) trimWhitespace(component.head);
		}
	}

	let map: SourceMapping[] = [];
	let code = options?.server
		? buildServerCode(template, options)
		: buildCode(template, map, options);
	let styles = template.components
		.map((c) =>
			c.style ? { style: buildStyles(c.style, c.style.hash), hash: c.style.hash } : undefined,
		)
		.filter((c) => c !== undefined);
	return {
		code,
		styles,
		map,
	};
}
