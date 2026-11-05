import { mount } from "@torpor/view";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedHandle from "../types/EmbedHandle";
import { embedProps, handleModule, prepareModule, type ModuleEmbedOptions } from "./prepareModule";

/**
 * Loads a module-format embed artifact (`compileEmbed(..., { module: true })`)
 * as a real ES module and mounts it into an empty target element.
 *
 * Unlike mountEmbed this is asynchronous: the browser imports the code as a
 * blob module and resolves its import specifiers with its own module system
 * -- an import map on the host page resolves bare specifiers; specifiers
 * rewritten at publish time (the compiler's `resolveImport` option) resolve
 * directly.
 *
 * @param target The element to mount into. Like `mount` in @torpor/view, it
 * must have no child elements
 * @param artifact The embed artifact to run (format "module")
 * @param props Props to pass to the component
 * @param options Mount options
 */
export default async function mountModuleEmbed(
	target: Element,
	artifact: EmbedArtifact,
	props: Record<string, any> = {},
	options?: ModuleEmbedOptions,
): Promise<EmbedHandle> {
	const { component } = await prepareModule(artifact, options);
	mount(target, component as never, embedProps(artifact, props, options), options?.slots);
	return handleModule(artifact, target);
}
