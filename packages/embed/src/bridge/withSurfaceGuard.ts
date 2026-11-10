import type EmbedBridge from "../types/EmbedBridge";
import type EmbedSurface from "../types/EmbedSurface";

const VERBS: Record<keyof EmbedSurface, string> = {
	api: "invoked",
	emits: "emitted",
	pushes: "subscribed to",
};

const SECTIONS: Record<keyof EmbedSurface, string> = {
	api: "$embed.invoke",
	emits: "$embed.emit",
	pushes: "$embed.on",
};

/**
 * Wraps a scoped bridge so calls outside the artifact's declared surface
 * (its app manifest's `api`/`emits`/`pushes`) warn once per call — the
 * runtime half of the declared-surface check (the compile half runs in
 * `compileArtifact`, and it can only see string literals). Sections the
 * manifest doesn't declare gate nothing.
 */
export default function withSurfaceGuard(
	bridge: EmbedBridge,
	surface: EmbedSurface,
	artifactId: string,
): EmbedBridge {
	const warned = new Set<string>();

	const check = (section: keyof EmbedSurface, name: string): void => {
		const declared = surface[section];
		if (declared === undefined || declared.includes(name)) return;
		const key = `${section}:${name}`;
		if (warned.has(key)) return;
		warned.add(key);
		console.warn(
			`[torpor/embed] Embed "${artifactId}" ${VERBS[section]} "${name}", which is not declared in its app manifest (${SECTIONS[section]}). Declare it in the manifest's ${section} block, or extend the declaration.`,
		);
	};

	return {
		emit: (type, detail, source) => {
			check("emits", type);
			bridge.emit(type, detail, source);
		},
		invoke: (method, payload, source) => {
			check("api", method);
			return bridge.invoke(method, payload, source);
		},
		on:
			bridge.on &&
			((type, handler) => {
				check("pushes", type);
				return bridge.on!(type, handler);
			}),
	};
}
