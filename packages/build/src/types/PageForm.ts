import type TypedResponse from "../response/TypedResponse";

/** The non-undefined return values of an endpoint's actions. */
type ActionReturns<Actions> = {
	[K in keyof Actions]: Actions[K] extends (event: any) => infer Return
		? NonNullable<Awaited<Return>>
		: never;
}[keyof Actions];

/**
 * The form result an endpoint's actions produce, i.e. what becomes the page's
 * `$props.form` after a submit, e.g.
 *
 * ```ts
 * import type server from "./+page.server";
 * type Form = PageForm<typeof server>;
 * ```
 *
 * Actions returning typed responses (e.g. `ok({ ... })`, `badRequest({ ... })`)
 * contribute their JSON bodies as a union. Falls back to a loose record when
 * there are no actions or their responses are untyped.
 */
export type PageForm<EndPoint> = EndPoint extends { actions?: infer Actions }
	? [NonNullable<Actions>] extends [never]
		? Record<string, any>
		: ActionReturns<NonNullable<Actions>> extends TypedResponse<infer Body>
			? Body
			: Record<string, any>
	: Record<string, any>;
