import { unmount } from "@torpor/view";
import checkVersion from "../checkVersion";
import embedProps from "../bridge/embedProps";
import getRuntimeVersion from "../server/getRuntimeVersion";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedHandle from "../types/EmbedHandle";
import type EmbedOptions from "../types/EmbedOptions";
import injectStyles, { removeStyles } from "./injectStyles";
import importModule from "./importModule";

export { embedProps };

export interface ModuleEmbedOptions extends EmbedOptions {
	/**
	 * Loads the artifact's module code and returns its namespace. Defaults
	 * to a blob-URL `import()`. Hosts with their own module pipeline (SSR
	 * environments, tests, cached module registries) can replace it; it
	 * must resolve the code's import specifiers the same way every time.
	 */
	import?: typeof importModule;
}

/**
 * The parts of mountModuleEmbed/hydrateModuleEmbed that differ from the
 * globals loader: async component loading plus a version check against the
 * installed runtime by default (module code imports the runtime itself, so
 * a mismatch is a broken page, not a subtle behavior change).
 */
export async function prepareModule(
	artifact: EmbedArtifact,
	options?: ModuleEmbedOptions,
): Promise<{ component: unknown }> {
	const expected = options?.runtimeVersion ?? getRuntimeVersion();
	checkVersion(artifact.version, expected, {
		allowMismatch: options?.allowVersionMismatch,
	});

	const namespace = await (options?.import ?? importModule)(artifact.client.code);
	const component = namespace.default;
	if (typeof component !== "function") {
		throw new Error(
			`Embed "${artifact.id}" does not contain a default export component. The artifact may be corrupt -- recompile it from its source.`,
		);
	}
	if (options?.styles !== false) injectStyles(artifact);
	return { component };
}

/**
 * Returns a handle that tears down a module embed mounted into `target`.
 */
export function handleModule(artifact: EmbedArtifact, target: Element): EmbedHandle {
	return {
		unmount() {
			unmount(target);
			removeStyles(artifact);
		},
	};
}
