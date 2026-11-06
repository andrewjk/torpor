import checkVersion from "../checkVersion";
import embedProps from "../bridge/embedProps";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedBridge from "../types/EmbedBridge";
import type EmbedRenderResult from "../types/EmbedRenderResult";
import getRuntimeVersion from "./getRuntimeVersion";
import renderInProcess, { type RenderInProcessOptions } from "./renderInProcess";
import renderInWorker from "./renderInWorker";

export interface RenderEmbedOptions extends RenderInProcessOptions {
	/**
	 * Render in a worker thread: a separate realm with its own globals that
	 * is terminated hard at the timeout, so a runaway or hanging embed can't
	 * take the host's event loop down with it. Props must be serializable,
	 * and slots are not supported. Recommended whenever the artifact's
	 * author isn't fully trusted.
	 */
	isolate?: boolean;

	/**
	 * The bridge the embed can call during server rendering (e.g. an
	 * `@await` that fetches section data). Injected as the `$embed` prop.
	 */
	bridge?: EmbedBridge;

	/**
	 * Host modules the embed may import, keyed by the specifier used in the
	 * embed's source -- the server build's imports are stripped and these
	 * namespaces are injected instead (see EmbedOptions.scope).
	 */
	scope?: Record<string, unknown>;

	/**
	 * The expected runtime version. Defaults to the installed
	 * @torpor/view's version, and mismatches throw.
	 */
	runtimeVersion?: string;

	/**
	 * Log a warning and continue on a version mismatch instead of throwing.
	 */
	allowVersionMismatch?: boolean;
}

/**
 * Server-renders a stored embed artifact to HTML, ready to be placed in the
 * page and hydrated on the client with `hydrateEmbed` and the same props.
 *
 * The embed's code runs on your server, so treat the author's trust level
 * accordingly:
 *
 * - **Trusted** (your own team): the default in-process render is fine.
 * - **Semi-trusted** (paying admins): pass `isolate: true`, which renders
 *   in a worker thread with a hard timeout. Fault isolation, not a security
 *   boundary -- workers share the process.
 * - **Untrusted**: don't render server-side at all; serve the artifact and
 *   render it client-side inside a sandboxed iframe.
 *
 * The artifact's version is checked against the installed @torpor/view
 * before rendering; recompile stale artifacts from `artifact.source`.
 */
export default async function renderEmbed(
	artifact: EmbedArtifact,
	options?: RenderEmbedOptions,
): Promise<EmbedRenderResult> {
	if (artifact.format === "restricted") {
		throw new Error(
			`Embed "${artifact.id}" is a restricted artifact (its server build is data, not JS). Render it with renderRestricted from "@torpor/embed/restricted".`,
		);
	}
	checkVersion(artifact.version, options?.runtimeVersion ?? getRuntimeVersion(), {
		allowMismatch: options?.allowVersionMismatch,
	});

	const props = embedProps(artifact, options?.props ?? {}, options);
	const renderOptions = { ...options, props };

	if (options?.isolate) {
		// Host bridge handlers and scope values are functions; they can't
		// cross the worker boundary. Fail loudly rather than silently
		// rendering an embed whose imports are unresolvable.
		const hostImports = (artifact.imports ?? []).filter(
			(imported) => imported.source !== "@torpor/view",
		);
		if (hostImports.length > 0 || options.scope) {
			throw new Error(
				"Embed requires host-side values (scope/bridge) that cannot cross the worker boundary. Render without isolation, or pass the data as props.",
			);
		}
		const workerProps = { ...renderOptions.props };
		delete workerProps.$embed;
		const result = await renderInWorker(artifact, {
			props: workerProps,
			context: renderOptions.context,
			timeout: renderOptions.timeout,
		});
		return { ...result, styles: artifact.styles };
	}
	const result = await renderInProcess(artifact, renderOptions);
	return { ...result, styles: artifact.styles };
}
