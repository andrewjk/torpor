import { mount } from "@torpor/view";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedHandle from "../types/EmbedHandle";
import type EmbedOptions from "../types/EmbedOptions";
import { handle, prepare } from "./prepare";

/**
 * Compiles (evaluates) an embed artifact's client code and mounts it into an
 * empty target element. Fully synchronous: the artifact is data, so there is
 * nothing to fetch.
 *
 * @param target The element to mount into. Like `mount` in @torpor/view, it
 * must have no child elements
 * @param artifact The embed artifact to run
 * @param props Props to pass to the component
 * @param options Mount options
 */
export default function mountEmbed(
	target: Element,
	artifact: EmbedArtifact,
	props: Record<string, any> = {},
	options?: EmbedOptions,
): EmbedHandle {
	const component = prepare(artifact, options);
	mount(target, component as never, props, options?.slots);
	return handle(artifact, target);
}
