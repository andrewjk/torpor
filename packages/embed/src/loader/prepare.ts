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
 * Evaluated components, keyed by artifact object. A WeakMap so caches die
 * with the artifact -- no host-side eviction to think about.
 */
const componentCache = new WeakMap<EmbedArtifact, unknown>();

/**
 * Checks the artifact against the running version and evaluates its client
 * code, ready to be mounted or hydrated. Shared by mountEmbed/hydrateEmbed.
 */
export function prepare(artifact: EmbedArtifact, options?: EmbedOptions): unknown {
	if (artifact.format === "module") {
		throw new Error(
			'Embed is in module format -- use mountModuleEmbed/hydrateModuleEmbed (from "@torpor/embed") instead.',
		);
	}
	if (options?.runtimeVersion !== undefined) {
		checkVersion(artifact.version, options.runtimeVersion, {
			allowMismatch: options?.allowVersionMismatch,
		});
	}
	let component: unknown;
	if (options?.cache) {
		const cached = componentCache.get(artifact);
		if (cached === undefined) {
			component = loadComponent(artifact);
			componentCache.set(artifact, component);
		} else {
			component = cached;
		}
	} else {
		component = loadComponent(artifact);
	}
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
