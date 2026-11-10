import createBridge from "./createBridge";
import scopeBridge from "./scopeBridge";
import withSurfaceGuard from "./withSurfaceGuard";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedBridge from "../types/EmbedBridge";

/**
 * Returns the props to pass to the component, with the bridge injected as
 * the reserved `$embed` prop. A `$embed` prop set explicitly by the host
 * wins over `options.bridge`. Shared by the client loader and the server
 * renderer.
 *
 * When the artifact carries a declared surface (its app manifest's
 * `api`/`emits`/`pushes`), the scoped bridge is guarded: calls outside the
 * declaration warn in the console.
 */
export default function embedProps(
	artifact: EmbedArtifact,
	props: Record<string, any>,
	options?: { bridge?: EmbedBridge },
): Record<string, any> {
	if (props.$embed !== undefined) return props;
	const scoped = options?.bridge
		? scopeBridge(options.bridge, { artifactId: artifact.id })
		: createBridge({});
	const bridge =
		options?.bridge && artifact.surface
			? withSurfaceGuard(scoped, artifact.surface, artifact.id)
			: scoped;
	return { ...props, $embed: bridge };
}
