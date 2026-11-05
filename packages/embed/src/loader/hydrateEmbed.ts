import { hydrate } from "@torpor/view";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedHandle from "../types/EmbedHandle";
import type EmbedOptions from "../types/EmbedOptions";
import { embedProps, handle, prepare } from "./prepare";

/**
 * Evaluates an embed artifact's client code and hydrates server-rendered
 * markup inside the target element.
 *
 * @param target The element containing the server-rendered markup
 * @param artifact The embed artifact to run
 * @param props The same props that were passed to the server build
 * @param options Hydrate options
 */
export default function hydrateEmbed(
	target: Element,
	artifact: EmbedArtifact,
	props: Record<string, any> = {},
	options?: EmbedOptions,
): EmbedHandle {
	const component = prepare(artifact, options);
	hydrate(target, component as never, embedProps(artifact, props, options), options?.slots);
	return handle(artifact, target);
}
