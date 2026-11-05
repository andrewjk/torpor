import type { ServerSlotRender } from "@torpor/view/ssr";
import type EmbedArtifact from "../types/EmbedArtifact";
import loadServerComponent from "./loadServerComponent";

export interface RenderInProcessOptions {
	props?: Record<string, any>;
	context?: Record<string, any>;
	slots?: Record<string, ServerSlotRender>;
	/**
	 * Host modules the embed may import, keyed by the specifier used in the
	 * embed's source (see EmbedOptions.scope).
	 */
	scope?: Record<string, unknown>;
	/**
	 * Soft timeout in milliseconds: the returned promise rejects after this,
	 * but the render itself keeps running (CPU-bound loops cannot be
	 * interrupted in-process). Use `isolate` for a hard timeout. Default
	 * 5000.
	 */
	timeout?: number;
}

/**
 * Renders an embed server-side, in the current process. Fast, and slots are
 * supported, but the embed's code runs with full access to the process
 * (this is a fault containment boundary, not a security boundary) and its
 * timeout is soft.
 */
export default async function renderInProcess(
	artifact: EmbedArtifact,
	options?: RenderInProcessOptions,
): Promise<{ body: string; head: string }> {
	const component = loadServerComponent(artifact, options?.scope);
	const timeout = options?.timeout ?? 5000;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const render = component(options?.props ?? {}, options?.context, options?.slots);
	// If the timeout wins the race, the render continues in the background;
	// swallow its eventual result so it doesn't surface as an unhandled
	// rejection. The race below still sees errors that happen before it.
	render.catch(() => {});
	try {
		return await Promise.race([
			render,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => {
					reject(
						new Error(
							`Embed "${artifact.id}" timed out after ${timeout}ms. Use { isolate: true } for a hard timeout that interrupts CPU-bound renders.`,
						),
					);
				}, timeout);
			}),
		]);
	} finally {
		if (timer !== undefined) clearTimeout(timer);
	}
}
