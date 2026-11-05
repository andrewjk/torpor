import * as view from "@torpor/view";
import type EmbedArtifact from "../types/EmbedArtifact";

/**
 * Evaluates an artifact's client code and returns its component.
 *
 * The compiled code has its imports stripped, and expects the runtime's
 * exports as bare identifiers (`$watch`, `t_anchor`, `mount` etc.). Rather
 * than polluting the host page's `globalThis` (as a REPL in an iframe can),
 * the code is evaluated inside a function whose parameters are the runtime
 * exports. This also keeps the runtime instance shared with the host app:
 * components, effects and regions all come from the one `@torpor/view` the
 * page already loaded.
 */
export default function loadComponent(artifact: EmbedArtifact): unknown {
	const names = Object.keys(view);
	const values = Object.values(view) as unknown[];
	// Names must be valid identifiers to be used as function parameters
	if (names.some((name) => !/^[A-Za-z_$][\w$]*$/.test(name))) {
		throw new Error("Runtime export names are not valid identifiers");
	}
	const make = new Function(...names, `${artifact.client.code}\nreturn ${artifact.name};`); // eslint-disable-line no-implied-eval
	const component = make(...values);
	if (typeof component !== "function") {
		throw new Error(
			`Embed "${artifact.id}" does not contain a component named "${artifact.name}". The artifact may be corrupt -- recompile it from its source.`,
		);
	}
	return component;
}
