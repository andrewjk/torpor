import { Worker } from "node:worker_threads";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedRenderResult from "../types/EmbedRenderResult";
import resolveWorkerPath from "./resolveWorkerPath";

export interface RenderInWorkerOptions {
	props?: Record<string, any>;
	context?: Record<string, any>;
	/**
	 * Hard timeout in milliseconds: the worker is terminated at the
	 * deadline, interrupting even CPU-bound renders. Default 5000.
	 */
	timeout?: number;
}

/**
 * Renders an embed server-side in a worker thread: a separate realm with
 * its own globals, terminated hard at the timeout.
 *
 * This is fault isolation (crashes, hangs, runaway loops stay in the
 * worker), not a security boundary -- worker threads share the process's
 * memory and Node builtins. For truly hostile authors, render in a separate
 * process or runtime instead.
 */
export default async function renderInWorker(
	artifact: EmbedArtifact,
	options?: RenderInWorkerOptions,
): Promise<{ body: string; head: string }> {
	const timeout = options?.timeout ?? 5000;
	const worker = new Worker(resolveWorkerPath(), {
		// The .mjs extension makes this an ES module worker
		workerData: {
			artifact: {
				id: artifact.id,
				name: artifact.name,
				server: { code: artifact.server?.code ?? "" },
			},
			props: options?.props,
			context: options?.context,
		},
		// Props and context cross the boundary by structured clone: they must
		// be serializable data
	});

	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			void worker.terminate();
			reject(new Error(`Embed "${artifact.id}" timed out after ${timeout}ms (worker terminated)`));
		}, timeout);
	});

	try {
		const result = await Promise.race([
			new Promise<EmbedRenderResult>((resolve, reject) => {
				worker.on(
					"message",
					(message: { result?: EmbedRenderResult; error?: { message: string } }) => {
						if (message.error) reject(new Error(message.error.message));
						else resolve(message.result!);
					},
				);
				worker.on("error", reject);
				worker.on("exit", (code) => {
					if (code !== 0) reject(new Error(`Embed worker exited with code ${code}`));
				});
			}),
			timeoutPromise,
		]);
		return result;
	} finally {
		if (timer !== undefined) clearTimeout(timer);
		void worker.terminate();
	}
}
