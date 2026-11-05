import createBridge from "./createBridge";
import scopeBridge from "./scopeBridge";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedBridge from "../types/EmbedBridge";

/**
 * Returns the props to pass to the component, with the bridge injected as
 * the reserved `$embed` prop. A `$embed` prop set explicitly by the host
 * wins over `options.bridge`. Shared by the client loader and the server
 * renderer.
 */
export default function embedProps(
	artifact: EmbedArtifact,
	props: Record<string, any>,
	options?: { bridge?: EmbedBridge },
): Record<string, any> {
	if (props.$embed !== undefined) return props;
	const bridge = options?.bridge
		? scopeBridge(options.bridge, { artifactId: artifact.id })
		: createBridge({});
	return { ...props, $embed: bridge };
}
