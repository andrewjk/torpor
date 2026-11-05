import { hydrate } from "@torpor/view";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedHandle from "../types/EmbedHandle";
import { embedProps, handleModule, prepareModule, type ModuleEmbedOptions } from "./prepareModule";

/**
 * Loads a module-format embed artifact as a real ES module and hydrates
 * server-rendered markup inside the target element. See mountModuleEmbed
 * for how the code is loaded.
 *
 * @param target The element containing the server-rendered markup
 * @param artifact The embed artifact to run (format "module")
 * @param props The same props that were passed to the server build
 * @param options Hydrate options
 */
export default async function hydrateModuleEmbed(
	target: Element,
	artifact: EmbedArtifact,
	props: Record<string, any> = {},
	options?: ModuleEmbedOptions,
): Promise<EmbedHandle> {
	const { component } = await prepareModule(artifact, options);
	hydrate(target, component as never, embedProps(artifact, props, options), options?.slots);
	return handleModule(artifact, target);
}
