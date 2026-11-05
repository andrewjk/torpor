import { unmount } from "@torpor/view";
import createBridge from "../bridge/createBridge";
import scopeBridge from "../bridge/scopeBridge";
import checkVersion from "../checkVersion";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedHandle from "../types/EmbedHandle";
import type EmbedOptions from "../types/EmbedOptions";
import injectStyles, { removeStyles } from "./injectStyles";
import loadComponent from "./loadComponent";

/**
 * Returns the props to pass to the component, with the bridge injected as
 * the reserved `$embed` prop. A `$embed` prop set explicitly by the host
 * wins over `options.bridge`.
 */
export function embedProps(
	artifact: EmbedArtifact,
	props: Record<string, any>,
	options?: EmbedOptions,
): Record<string, any> {
	if (props.$embed !== undefined) return props;
	const bridge = options?.bridge
		? scopeBridge(options.bridge, { artifactId: artifact.id })
		: createBridge({});
	return { ...props, $embed: bridge };
}

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
