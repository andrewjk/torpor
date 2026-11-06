import type EmbedBridge from "../types/EmbedBridge";

/**
 * One method of an embed's bridge API: the payload the embed sends and the
 * result the host handler resolves with. Declare `payload` only when the
 * method takes one.
 */
export interface EmbedApiMethod {
	payload?: any;
	result?: any;
}

/**
 * An embed's bridge API contract, keyed by method name. Define it as a
 * type, once, and share it between the host and the embed author.
 */
export type EmbedApi = Record<string, EmbedApiMethod>;

/**
 * An `EmbedBridge` whose `invoke` is typed by an API contract: method names
 * are checked, payloads are required exactly when the contract declares
 * them, and results are typed.
 *
 * ```ts
 * // shared contract (a types module both sides copy or import)
 * type SectionApi = {
 * 	"fetch-data": { result: string };
 * 	"save-section": { payload: { name: string }; result: "ok" };
 * };
 *
 * // in the embed: const embed = $props.$embed as EmbedApiBridge<SectionApi>;
 * const data = await embed.invoke("fetch-data"); // Promise<string>
 * await embed.invoke("save-section", { name: "ada" }); // Promise<"ok">
 * await embed.invoke("nope"); // type error: not in the contract
 * ```
 */
export type EmbedApiBridge<Api extends EmbedApi> = Omit<EmbedBridge, "invoke"> & {
	invoke<M extends keyof Api & string>(
		...args: Api[M] extends { payload: infer P } ? [method: M, payload: P] : [method: M]
	): Promise<Api[M] extends { result: infer R } ? R : unknown>;
};
