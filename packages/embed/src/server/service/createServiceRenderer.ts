import type EmbedArtifact from "../../types/EmbedArtifact";
import type EmbedRenderResult from "../../types/EmbedRenderResult";

export interface ServiceRendererOptions {
	/**
	 * The render service's base URL, e.g. `http://render-pool.internal:8080`
	 * or the `url` returned by startRenderServer.
	 */
	url: string;

	/**
	 * Bearer token, when the service was started with one.
	 */
	token?: string;

	/**
	 * HTTP timeout in milliseconds. Should exceed the render timeouts you
	 * send; the service itself terminates runaway renders at their timeout,
	 * so this only guards against transport hangs. Default 10000.
	 */
	timeout?: number;
}

export interface ServiceRenderOptions {
	props?: Record<string, any>;
	context?: Record<string, any>;
	/**
	 * Render timeout in milliseconds, enforced by the service (it terminates
	 * runaway renders). Default: whatever the service was started with.
	 */
	timeout?: number;
}

export type ServiceRenderer = (
	artifact: EmbedArtifact,
	options?: ServiceRenderOptions,
) => Promise<EmbedRenderResult>;

/**
 * Creates a drop-in replacement for `renderEmbed` that renders on a remote
 * render service (see startRenderServer) instead of in this process.
 *
 * Use it when the render pool runs in a locked-down container: rendering
 * untrusted embeds then happens inside that boundary -- non-root, read-only
 * filesystem, no network egress -- rather than inside your app's process.
 * The container is the security boundary; this client is just the protocol.
 *
 * Slots and the host bridge are functions and cannot cross the service
 * boundary, so they are not part of the options; pass data as props. The
 * service runs its own runtime version and rejects artifacts it can't run
 * (409) -- recompile them from `artifact.source`.
 */
export default function createServiceRenderer(options: ServiceRendererOptions): ServiceRenderer {
	const timeout = options.timeout ?? 10_000;

	return async (artifact, renderOptions) => {
		const response = await fetch(`${options.url.replace(/\/$/, "")}/render`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				...(options.token !== undefined ? { authorization: `Bearer ${options.token}` } : {}),
			},
			body: JSON.stringify({
				artifact,
				props: renderOptions?.props ?? {},
				context: renderOptions?.context,
				timeout: renderOptions?.timeout,
			}),
			signal: AbortSignal.timeout(timeout),
		});

		const payload = (await response.json()) as Partial<EmbedRenderResult> & { error?: string };
		if (!response.ok) {
			throw new Error(
				`Render service error (${response.status}): ${payload.error ?? response.statusText}`,
			);
		}
		return { body: payload.body ?? "", head: payload.head ?? "", styles: payload.styles ?? [] };
	};
}
