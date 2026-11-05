import * as ssr from "@torpor/view/ssr";
import type { ServerComponent } from "@torpor/view/ssr";

/**
 * Evaluates an artifact's server code and returns its component.
 *
 * The server build imports from "@torpor/view/ssr"; since evaluation happens
 * in a function scope rather than a module, those imports are stripped and
 * the SSR runtime exports are injected as parameters instead. This keeps a
 * second @torpor/view instance out of play and means the only identifiers
 * the embed code can reference are the SSR runtime and its own -- it cannot
 * resolve new imports at render time.
 */
export default function loadServerComponent(artifact: {
	name: string;
	server: { code: string };
}): ServerComponent {
	const names = Object.keys(ssr);
	const values = Object.values(ssr);
	const code = artifact.server.code
		.replace("export default ", "")
		// Sucrase hoists its helpers above the import statements, so don't
		// rely on line anchors here
		.replace(/import\s*\{[^}]+\}\s*from\s*"[^"]*";/g, "");
	const make = new Function(...names, `${code}\nreturn ${artifact.name};`); // eslint-disable-line no-implied-eval
	const component = make(...values);
	if (typeof component !== "function") {
		throw new Error(
			`Embed server build does not contain a component named "${artifact.name}". The artifact may be corrupt -- recompile it from its source.`,
		);
	}
	return component as ServerComponent;
}
