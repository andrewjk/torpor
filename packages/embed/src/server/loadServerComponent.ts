import * as ssr from "@torpor/view/ssr";
import type { ServerComponent } from "@torpor/view/ssr";
import type EmbedArtifact from "../types/EmbedArtifact";
import { flattenScope, validateImports, type EmbedScope } from "../loader/scope";
/**
 * Evaluates an artifact's server code and returns its component.
 *
 * The server build imports from "@torpor/view/ssr"; since evaluation happens
 * in a function scope rather than a module, those imports are stripped and
 * the SSR runtime exports are injected as parameters instead -- along with
 * any host modules the embed imports (via `scope`). This keeps a second
 * @torpor/view instance out of play and means the only identifiers the
 * embed code can reference are the SSR runtime, the scope, and its own --
 * it cannot resolve new imports at render time.
 */
export default function loadServerComponent(
	artifact: {
		name: string;
		server?: { code?: string };
		imports?: EmbedArtifact["imports"];
		id: string;
	},
	scope?: EmbedScope,
): ServerComponent {
	const injected = { ...ssr, ...flattenScope(scope) };
	validateImports(artifact, injected);
	const names = Object.keys(injected);
	const values = Object.values(injected);
	const serverCode = artifact.server?.code;
	if (serverCode === undefined) {
		throw new Error(
			`Embed "${artifact.id}" has no JS server build -- restricted artifacts render with renderRestricted from "@torpor/embed/restricted".`,
		);
	}
	const code = serverCode
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
