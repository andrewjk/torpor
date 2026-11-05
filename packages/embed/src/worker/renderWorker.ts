import { parentPort, workerData } from "node:worker_threads";
import * as ssr from "@torpor/view/ssr";
import type EmbedArtifact from "../types/EmbedArtifact";

/**
 * Worker entry for `renderEmbed` with `isolate: true`. Renders one embed and
 * exits. The parent terminates the worker on timeout, which is what makes
 * the isolation a hard boundary: even a CPU-bound loop in the embed's code
 * is stopped at the timeout instead of hanging the host's event loop.
 *
 * Note this is fault isolation, not a security boundary -- workers share the
 * process. See renderEmbed's docs.
 */

const artifact = workerData.artifact as Pick<EmbedArtifact, "id" | "name" | "server">;
const props = workerData.props as Record<string, any>;
const context = workerData.context as Record<string, any> | undefined;

let warnedEmit = false;

/**
 * The bridge available inside an isolated render. Host handlers can't cross
 * the worker boundary, so calls fail loudly rather than corrupting the
 * rendered HTML with silent undefineds.
 */
function workerBridge() {
	return {
		emit: (type: string) => {
			if (!warnedEmit) {
				warnedEmit = true;
				console.warn(
					`[torpor/embed] Embed emitted "${type}" during an isolated render; the host can't receive events from a worker. Events are client-side.`,
				);
			}
		},
		invoke: (method: string): never => {
			throw new Error(
				`Embed called $embed.invoke("${method}") during an isolated (worker) render, but host APIs can't be bridged across the worker boundary. Pass the data as props instead, or render without isolation.`,
			);
		},
	};
}

function fail(error: unknown): void {
	const err = error as Error;
	parentPort?.postMessage({
		error: { message: err?.message ?? String(error), stack: err?.stack },
	});
}

try {
	const names = Object.keys(ssr);
	const values = Object.values(ssr);
	const code = artifact.server.code
		.replace("export default ", "")
		.replace(/import\s*\{[^}]+\}\s*from\s*"[^"]*";/g, "");
	const make = new Function(...names, `${code}\nreturn ${artifact.name};`); // eslint-disable-line no-implied-eval
	const component = make(...values);
	if (typeof component !== "function") {
		throw new Error(`Embed server build does not contain a component named "${artifact.name}"`);
	}
	const renderProps = { ...props, $embed: workerBridge() };
	const result = await component(renderProps ?? {}, context, undefined);
	parentPort?.postMessage({ result });
} catch (error) {
	fail(error);
}
