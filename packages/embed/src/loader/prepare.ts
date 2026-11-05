import { unmount } from "@torpor/view";
import checkVersion from "../checkVersion";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedHandle from "../types/EmbedHandle";
import type EmbedOptions from "../types/EmbedOptions";
import embedProps from "../bridge/embedProps";
import injectStyles, { removeStyles } from "./injectStyles";
import loadComponent from "./loadComponent";

export { embedProps };

/**
 * Checks the artifact against the running version and evaluates its client
 * code, ready to be mounted or hydrated. Shared by mountEmbed/hydrateEmbed.
 */
export function prepare(artifact: EmbedArtifact, options?: EmbedOptions): unknown {
	if (options?.runtimeVersion !== undefined) {
		checkVersion(artifact.version, options.runtimeVersion, {
			allowMismatch: options?.allowVersionMismatch,
		});
	}
	const component = loadComponent(artifact);
	if (options?.styles !== false) injectStyles(artifact);
	return component;
}

/**
 * Returns a handle that tears down an embed mounted into `target`.
 */
export function handle(artifact: EmbedArtifact, target: Element): EmbedHandle {
	return {
		unmount() {
			unmount(target);
			removeStyles(artifact);
		},
	};
}
